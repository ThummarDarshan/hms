import os

def replace_in_file(filepath, old, new):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        if old in content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content.replace(old, new))
            print(f'Replaced in {filepath}')
    except Exception as e:
        print(f"Error reading {filepath}: {e}")

for d in [r'e:\D DRIVE\4TH SEM\sgp\finall\HMS\clinic_backend', r'e:\D DRIVE\4TH SEM\sgp\finall\HMS\clinic_frontend']:
    for root, dirs, files in os.walk(d):
        if 'venv' in root or 'node_modules' in root or '__pycache__' in root or '.git' in root:
            continue
        for file in files:
            if file.endswith(('.py', '.ts', '.tsx', '.json', '.js', '.jsx')):
                replace_in_file(os.path.join(root, file), 'LAB_TECH', 'LAB_TECHNICIAN')
