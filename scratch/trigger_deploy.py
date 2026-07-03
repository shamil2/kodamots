import os
import json
import urllib.request

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
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }

    req = urllib.request.Request(
        'https://api.render.com/v1/services/srv-d941cfojs32c73dd90b0/deploys',
        data=json.dumps({}).encode('utf-8'),
        headers=headers,
        method='POST'
    )
    try:
        with urllib.request.urlopen(req) as res:
            response = json.loads(res.read().decode('utf-8'))
            print("🚀 Successfully triggered deploy!")
            print(f"Deploy ID: {response['id']}")
            print(f"Status:    {response['status']}")
    except Exception as e:
        print(f"Error triggering deploy: {e}")

if __name__ == '__main__':
    main()
