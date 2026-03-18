from pathlib import Path

import psycopg2


def load_env(path: Path) -> dict:
    data = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        data[k.strip()] = v.strip()
    return data


def main():
    env = load_env(Path(__file__).parent / ".env")
    conn = psycopg2.connect(
        host=env["DATABASE_HOST"],
        port=env.get("DATABASE_PORT", "5432"),
        dbname=env["DATABASE_NAME"],
        user=env["DATABASE_USER"],
        password=env["DATABASE_PASSWORD"],
        sslmode="require",
    )
    conn.autocommit = False

    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO lab_requests (id, status, notes, requested_at, appointment_id, doctor_id, patient_id, test_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT DO NOTHING
                """,
                (9, "COMPLETED", "dfj;", "2026-03-18 11:26:24.273622", 5, 2, 3, 5),
            )

            cur.execute(
                """
                INSERT INTO lab_reports (id, report_file, result_summary, uploaded_at, lab_request_id, technician_id, charge)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT DO NOTHING
                """,
                (9, "lab_reports/FDSA_CIE2_QA.pdf", "sackh", "2026-03-18 11:27:14.063914", 9, 5, 5000.00),
            )

            cur.execute(
                "SELECT setval(pg_get_serial_sequence('lab_requests', 'id'), COALESCE((SELECT MAX(id) FROM lab_requests), 1), true)"
            )
            cur.execute(
                "SELECT setval(pg_get_serial_sequence('lab_reports', 'id'), COALESCE((SELECT MAX(id) FROM lab_reports), 1), true)"
            )

        conn.commit()
        print("Final lab_request and lab_report rows inserted successfully.")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
