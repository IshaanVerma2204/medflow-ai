import subprocess

try:
    result = subprocess.run(
        ["docker", "compose", "logs", "api", "--tail", "50"],
        cwd=r"C:\Users\Ishaan Verma\.gemini\antigravity\scratch\medflow-ai",
        capture_output=True,
        text=True,
        shell=True # Use shell=True for Windows
    )
    print("STDOUT:", result.stdout)
    print("STDERR:", result.stderr)
except Exception as e:
    print("ERROR:", str(e))
