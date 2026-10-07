import subprocess

def operation(value):
    result = subprocess.run([value['command'], *value['args']], capture_output=True, text=True)
    return {'stdout': result.stdout, 'status': result.returncode}
