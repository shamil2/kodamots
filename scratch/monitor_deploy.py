import os
import sys
import json
import time
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
    deploy_id = sys.argv[1] if len(sys.argv) > 1 else 'dep-d941e0daeets73eqea10'
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

    print(f"Monitoring deploy: {deploy_id}")
    while True:
        req = urllib.request.Request(
            f'https://api.render.com/v1/services/srv-d941cfojs32c73dd90b0/deploys/{deploy_id}',
            headers=headers
        )
        try:
            with urllib.request.urlopen(req) as res:
                response = json.loads(res.read().decode('utf-8'))
                status = response['status']
                print(f"Status: {status} ...")
                if status == 'live':
                    print("\n🎉 SUCCESS! Your deployment is live!")
                    sys.exit(0)
                elif status in ('build_failed', 'pre_deploy_failed', 'canceled'):
                    print(f"\n❌ FAILED! Deploy status: {status}")
                    sys.exit(1)
        except Exception as e:
            print(f"Error checking deploy status: {e}")
        
        time.sleep(15)

if __name__ == '__main__':
    main()
