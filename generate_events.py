import json

with open('parsed_events_plumber.txt', 'r', encoding='utf-8') as f:
    lines = [l.strip() for l in f.readlines() if l.strip()]

events = []
current_event = None
current_main_category = "Tech"
current_category = "Technical"

def get_icon(title, cat):
    title_lower = title.lower()
    if 'code' in title_lower or 'debug' in title_lower or 'bug' in title_lower or 'hack' in title_lower or 'algorithm' in title_lower or 'api' in title_lower:
        return "Code2"
    if 'dance' in title_lower or 'step' in title_lower:
        return "Music"
    if 'music' in title_lower or 'sing' in title_lower or 'band' in title_lower or 'tune' in title_lower or 'beatbox' in title_lower or 'anthakshari' in title_lower:
        return "Mic2"
    if 'photo' in title_lower or 'lens' in title_lower or 'short film' in title_lower or 'camera' in title_lower:
        return "Camera"
    if 'drama' in title_lower or 'act' in title_lower or 'skit' in title_lower or 'mime' in title_lower or 'comedy' in title_lower or 'ad zap' in title_lower or 'charades' in title_lower:
        return "Drama"
    if 'fashion' in title_lower or 'runway' in title_lower:
        return "Shirt"
    if 'game' in title_lower or 'esports' in title_lower or 'play' in title_lower or 'carrom' in title_lower or 'chess' in title_lower:
        return "Gamepad2"
    if 'sport' in cat.lower() or 'game' in cat.lower() or 'athletic' in cat.lower() or 'cricket' in title_lower or 'football' in title_lower or 'volleyball' in title_lower or 'throwball' in title_lower or 'basketball' in title_lower or 'kho kho' in title_lower or 'kabaddi' in title_lower or 'track' in title_lower or 'relay' in title_lower or 'shot put' in title_lower or 'throw' in title_lower or 'wrestling' in title_lower or 'lifting' in title_lower or 'push-up' in title_lower:
        return "Trophy"
    if 'tech' in title_lower or 'robo' in title_lower or 'hardware' in title_lower or 'gadget' in title_lower or 'cloud' in title_lower or 'data' in title_lower or 'architecture' in title_lower or 'app' in title_lower:
        return "Wrench"
    if 'art' in title_lower or 'paint' in title_lower or 'design' in title_lower or 'sketch' in title_lower or 'rangoli' in title_lower or 'mehendi' in title_lower or 'tattoo' in title_lower or 'doodle' in title_lower:
        return "Palette"
    if 'fun' in cat.lower() or 'hunt' in title_lower or 'treasure' in title_lower or 'escape' in title_lower or 'puzzle' in title_lower or 'mystery' in title_lower or 'bottle flip' in title_lower or 'lemon spoon' in title_lower or 'whisper' in title_lower or 'pani puri' in title_lower or 'balloon' in title_lower:
        return "Sparkles"
    if 'speak' in title_lower or 'debate' in title_lower or 'talk' in title_lower or 'jam' in title_lower or 'pitch' in title_lower or 'comedy' in title_lower or 'laugh' in title_lower:
        return "Mic"
    return "Sparkles"

for line in lines:
    if line in ('LIST OF EVENTS', 'TECHNICAL EVENTS LIST:'):
        current_main_category = "Tech"
        current_category = "Technical"
        continue
    elif line == 'NON-TECHNICAL EVENTS:':
        current_main_category = "Non-Tech"
        current_category = "Fun"
        continue
    elif line == 'CULTURALS EVENTS LIST:':
        current_main_category = "Non-Tech"
        current_category = "Culturals"
        continue
    elif line == 'DANCE EVENTS:':
        current_category = "Dance"
        continue
    elif line == 'MUSIC EVENTS:':
        current_category = "Music"
        continue
    elif line == 'THEATRE EVENTS:':
        current_category = "Theatre"
        continue
    elif line == 'SPEAKING & FYN EVENTS:':
        current_category = "Speaking"
        continue
    elif line == 'SPORTS EVENTS LIST:':
        current_main_category = "Sports"
        current_category = "Sports"
        continue
    elif line in ('OUTDOOR GAMES (BOYS):', 'INDOOR GAMES (BOYS):', 'ATHLETICS (BOYS):', 'OUTDOOR GAMES (GIRLS):', 'INDOOR GAMES (GIRLS):', 'ATHLETICS (GIRLS):'):
        current_main_category = "Sports"
        current_category = line.replace(':', '')
        continue
        
    if line.startswith('●'):
        if current_event:
            current_event["rules"].append(line.replace('●', '').strip())
    else:
        current_event = {"name": line, "category": current_category, "mainCategory": current_main_category, "rules": []}
        events.append(current_event)

ts_content = '''import {
  Camera,
  Code2,
  Drama,
  Gamepad2,
  Mic2,
  Mic,
  Music,
  Shirt,
  Sparkles,
  Trophy,
  Wrench,
  Palette
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Event = {
  name: string;
  category: string;
  mainCategory: "Tech" | "Non-Tech" | "Sports";
  icon: LucideIcon;
  rules: string[];
};

export const allEvents: Event[] = [
'''

for e in events:
    if not e['name']: continue
    icon = get_icon(e['name'], e['category'])
    rules_str = json.dumps(e['rules'])
    ts_content += f'''  {{
    name: {json.dumps(e['name'])},
    category: {json.dumps(e['category'])},
    mainCategory: "{e['mainCategory']}",
    icon: {icon},
    rules: {rules_str}
  }},
'''

ts_content += "];\n"

with open('src/lib/eventsData.ts', 'w', encoding='utf-8') as f:
    f.write(ts_content)
