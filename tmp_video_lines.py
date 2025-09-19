from pathlib import Path
path = Path('components/lesson/VideoPanel.tsx')
for no, line in enumerate(path.read_text().splitlines(), start=1):
    if no <= 140:
        print(f"{no}: {line}")
