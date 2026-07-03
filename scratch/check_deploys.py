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
        'Accept': 'application/json'
    }

    req = urllib.request.Request(
        'https://api.render.com/v1/services/srv-d941cfojs32c73dd90b0/deploys?limit=5',
        headers=headers
    )
    try:
        with urllib.request.urlopen(req) as res:
            deploys = json.loads(res.read().decode('utf-8'))
            for dep in deploys:
                d = dep['deploy']
                print(f"Deploy ID:  {d['id']}")
                print(f"Status:     {d['status']}")
                print(f"Commit Ref: {d.get('commit', {}).get('id', 'N/A')}")
                print(f"Commit Msg: {d.get('commit', {}).get('message', 'N/A')}")
                print(f"Created At: {d['createdAt']}")
                print("-" * 40)
    except Exception as e:
        print(f"Error checking deploys: {e}")

if __name__ == '__main__':
    main()
