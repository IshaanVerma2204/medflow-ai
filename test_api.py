import urllib.request
import urllib.parse
import json

data = urllib.parse.urlencode({'username': 'patient@demo.com', 'password': 'Demo1234!'}).encode('utf-8')
req = urllib.request.Request('http://localhost:8000/api/auth/login', data=data)
try:
    with urllib.request.urlopen(req) as f:
        token_data = json.loads(f.read().decode('utf-8'))
        token = token_data['access_token']
        
        req2 = urllib.request.Request('http://localhost:8000/api/auth/me')
        req2.add_header('Authorization', f'Bearer {token}')
        with urllib.request.urlopen(req2) as f2:
            print("ME RESPONSE:")
            me_data = json.loads(f2.read().decode('utf-8'))
            print(json.dumps(me_data, indent=2))
            
            patient_id = me_data.get('patient_profile_id')
            if patient_id:
                print(f"Fetching meds for {patient_id}")
                req3 = urllib.request.Request(f'http://localhost:8000/api/patients/{patient_id}/medications')
                req3.add_header('Authorization', f'Bearer {token}')
                with urllib.request.urlopen(req3) as f3:
                    meds = json.loads(f3.read().decode('utf-8'))
                    print("MEDICATIONS:", len(meds))
            else:
                print("NO PATIENT PROFILE ID FOUND IN ME")
except Exception as e:
    print("ERROR:", e)
    if hasattr(e, 'read'):
        print(e.read().decode())
