import json, time, random, pathlib
live_path = pathlib.Path('frontend/public/live.json')
now = time.gmtime(); ts = time.strftime('%Y-%m-%dT%H:%M:%SZ', now)
try: data = json.loads(live_path.read_text())
except Exception: data = {"game_id":"SIM-001","down":1,"distance":10,"yardline":50,"quarter":1,"clock":"15:00"}
def next_clock(clock):
    m,s = map(int, clock.split(':')); sec = max(0, m*60 + s - random.randint(5,25)); return f"{sec//60:02d}:{sec%60:02d}"
distance = max(1, min(15, (data.get('distance',10) + random.choice([-3,-2,-1,1,2,3]))))
yard = max(1, min(99, (data.get('yardline',50) + random.choice([-5,-3,-1,1,3,5]))))
down = data.get('down',1) + 1;  down = 1 if down>4 else down
quarter = data.get('quarter',1); clock = next_clock(data.get('clock','15:00'))
note = random.choice(["Formação pesada","No-huddle","Substituição ofensiva","Marcação em zona","Blitz provável"])
new_data = {"ts":ts,"game_id":data.get('game_id','SIM-001'),"down":down,"distance":distance,"yardline":yard,"quarter":quarter,"clock":clock,"note":note}
live_path.write_text(json.dumps(new_data, indent=2)); print("Updated live.json:", new_data)
