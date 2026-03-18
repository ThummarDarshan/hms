import ast
import os
import re
from pathlib import Path

import psycopg2
from psycopg2 import sql
from psycopg2.extras import execute_values


INSERT_RE = re.compile(
    r"INSERT INTO\s+`(?P<table>[^`]+)`\s*\((?P<cols>[^)]+)\)\s*VALUES\s*(?P<values>.*?);",
    re.IGNORECASE | re.DOTALL,
)


def parse_env(env_path: Path) -> dict:
    values = {}
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        values[k.strip()] = v.strip()
    return values


def split_value_tuples(values_blob: str) -> list[str]:
    tuples = []
    start = None
    depth = 0
    in_str = False
    esc = False

    for idx, ch in enumerate(values_blob):
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == "'":
                in_str = False
            continue

        if ch == "'":
            in_str = True
        elif ch == "(":
            if depth == 0:
                start = idx
            depth += 1
        elif ch == ")":
            depth -= 1
            if depth == 0 and start is not None:
                tuples.append(values_blob[start : idx + 1])
                start = None

    return tuples


def parse_tuple_literal(tuple_sql: str):
    py = tuple_sql.replace("NULL", "None")
    return ast.literal_eval(py)


def get_boolean_columns(cur, table_name: str) -> set[str]:
    cur.execute(
        """
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = %s
          AND data_type = 'boolean'
        """,
        (table_name,),
    )
    return {row[0] for row in cur.fetchall()}


def table_exists(cur, table_name: str) -> bool:
    cur.execute(
        """
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = %s
        )
        """,
        (table_name,),
    )
    return bool(cur.fetchone()[0])


def normalize_bool(value, is_bool_col: bool):
    if not is_bool_col:
        return value
    if value in (0, 1):
        return bool(value)
    return value


def reset_id_sequence(cur, table_name: str):
    cur.execute(
        sql.SQL(
            """
            SELECT pg_get_serial_sequence(%s, 'id')
            """
        ),
        (f"public.{table_name}",),
    )
    seq = cur.fetchone()[0]
    if not seq:
        return
    cur.execute(
        sql.SQL(
            """
            SELECT setval(%s, COALESCE((SELECT MAX(id) FROM {table}), 1), true)
            """
        ).format(table=sql.Identifier(table_name)),
        (seq,),
    )


def import_dump(dump_path: Path, env_path: Path):
    env = parse_env(env_path)
    conn = psycopg2.connect(
        host=env["DATABASE_HOST"],
        port=env.get("DATABASE_PORT", "5432"),
        dbname=env["DATABASE_NAME"],
        user=env["DATABASE_USER"],
        password=env["DATABASE_PASSWORD"],
        sslmode="require",
    )
    conn.autocommit = False

    sql_text = dump_path.read_text(encoding="utf-8", errors="ignore")
    matches = list(INSERT_RE.finditer(sql_text))

    inserted_total = 0
    skipped_tables = []
    failed_tables = []

    import_tables = {
        "users",
        "password_reset_tokens",
        "departments",
        "patients",
        "doctors",
        "doctor_slots",
        "appointments",
        "prescriptions",
        "beds_ward",
        "beds_bed",
        "beds_bedrequest",
        "beds_bedallocation",
        "lab_test_types",
        "lab_requests",
        "lab_reports",
        "billing",
        "queries",
        "notifications",
    }

    table_order = [
        "users",
        "password_reset_tokens",
        "departments",
        "patients",
        "doctors",
        "doctor_slots",
        "appointments",
        "prescriptions",
        "beds_ward",
        "beds_bed",
        "beds_bedrequest",
        "beds_bedallocation",
        "lab_test_types",
        "lab_requests",
        "lab_reports",
        "billing",
        "queries",
        "notifications",
    ]

    order_index = {name: idx for idx, name in enumerate(table_order)}

    parsed_inserts = []
    for m in matches:
        table = m.group("table")
        if table not in import_tables:
            continue
        cols = [c.strip().strip("`") for c in m.group("cols").split(",")]
        parsed_inserts.append((table, cols, m.group("values")))

    parsed_inserts.sort(key=lambda item: order_index.get(item[0], 10_000))

    try:
        with conn.cursor() as cur:
            existing_target_tables = [t for t in table_order if table_exists(cur, t)]
            if existing_target_tables:
                truncate_stmt = sql.SQL("TRUNCATE TABLE {} RESTART IDENTITY CASCADE").format(
                    sql.SQL(", ").join(sql.Identifier(t) for t in existing_target_tables)
                )
                cur.execute(truncate_stmt)
                conn.commit()

            for table, cols, values_blob in parsed_inserts:

                if not table_exists(cur, table):
                    skipped_tables.append(table)
                    continue

                bool_cols = get_boolean_columns(cur, table)
                tuple_sql_list = split_value_tuples(values_blob)

                rows = []
                for tuple_sql in tuple_sql_list:
                    parsed = parse_tuple_literal(tuple_sql)
                    if not isinstance(parsed, tuple):
                        parsed = (parsed,)
                    normalized = tuple(
                        normalize_bool(val, cols[i] in bool_cols) for i, val in enumerate(parsed)
                    )
                    rows.append(normalized)

                if not rows:
                    continue

                col_identifiers = [sql.Identifier(c) for c in cols]
                insert_stmt = sql.SQL("INSERT INTO {table} ({cols}) VALUES %s ON CONFLICT DO NOTHING").format(
                    table=sql.Identifier(table),
                    cols=sql.SQL(", ").join(col_identifiers),
                )
                try:
                    execute_values(cur, insert_stmt, rows, page_size=1000)
                    conn.commit()
                    inserted_total += len(rows)
                except Exception as exc:
                    conn.rollback()
                    row_failures = 0
                    row_success = 0
                    for row in rows:
                        try:
                            execute_values(cur, insert_stmt, [row], page_size=1)
                            conn.commit()
                            row_success += 1
                            inserted_total += 1
                        except Exception as row_exc:
                            conn.rollback()
                            row_failures += 1
                            failed_tables.append((table, str(row_exc)))

                    if row_success == 0:
                        failed_tables.append((table, str(exc)))

            # Align sequences for id columns
            cur.execute(
                """
                SELECT table_name
                FROM information_schema.columns
                WHERE table_schema='public' AND column_name='id'
                """
            )
            id_tables = [r[0] for r in cur.fetchall()]
            for table in id_tables:
                reset_id_sequence(cur, table)

        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

    print(f"Imported rows attempted: {inserted_total}")
    if skipped_tables:
        unique_skipped = sorted(set(skipped_tables))
        print("Skipped tables not present in current DB:")
        for t in unique_skipped:
            print(f" - {t}")

    if failed_tables:
        unique_failed = {}
        for table, err in failed_tables:
            if table not in unique_failed:
                unique_failed[table] = err.splitlines()[0]
        print("Tables with insert errors:")
        for table, err in unique_failed.items():
            print(f" - {table}: {err}")


if __name__ == "__main__":
    dump = Path(r"C:\Users\Admin\Downloads\clinic_management_system.sql")
    env_file = Path(__file__).parent / ".env"

    if not dump.exists():
        raise FileNotFoundError(f"Dump file not found: {dump}")
    if not env_file.exists():
        raise FileNotFoundError(f".env not found: {env_file}")

    import_dump(dump, env_file)
    print("MySQL dump import completed.")
