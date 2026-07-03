import os
import json
import urllib.request
import urllib.parse

def load_env(env_path):
    if not os.path.exists(env_path):
        return {}
    env = {}
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            k, v = line.split('=', 1)
            env[k.strip()] = v.strip()
    return env

def main():
    env_path = os.path.expanduser('~/.env')
    env = load_env(env_path)
    api_key = env.get('RENDER_API_KEY')
    if not api_key:
        print("Error: RENDER_API_KEY is not defined")
        return

    headers = {
        'Authorization': f'Bearer {api_key}',
        'Accept': 'application/json'
    }

    url = 'https://api.render.com/v1/logs?ownerId=tea-d40btef5r7bs73abq8b0&resource=srv-d941cfojs32c73dd90b0&limit=50'
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as res:
            logs = json.loads(res.read().decode('utf-8'))
            if isinstance(logs, list):
                for log_entry in reversed(logs):
                    if isinstance(log_entry, dict):
                        t = log_entry.get('timestamp')
                        txt = log_entry.get('text', '').strip()
                        inst = log_entry.get('instanceId', 'system')
                        print(f"{t} [{inst}] {txt}")
                    else:
                        print(f"Log element: {log_entry}")
            else:
                print(f"Response: {logs}")
    except Exception as e:
        print(f"Error checking logs: {e}")

if __name__ == '__main__':
    main()
