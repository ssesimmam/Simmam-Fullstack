import sys

def clean_text():
    with open('parsed_events.txt', 'r', encoding='utf-8') as f:
        lines = [l.strip() for l in f.readlines() if l.strip()]

    cleaned_lines = []
    current_line = []

    for line in lines:
        if line == '●' or line.startswith('●'):
            if current_line:
                cleaned_lines.append(' '.join(current_line))
            current_line = [line]
        elif line.isupper() and len(line.split()) <= 3 and "LIST" not in line and "EVENTS" not in line and not current_line:
            pass # ignore
        else:
            # If the current line is getting long and doesn't have a bullet, maybe it's a title?
            # Actually, titles don't have bullets.
            # A new event title starts after the last rule. 
            # How do we know a title? It doesn't start with bullet and comes after a rule.
            
            # For simplicity, just append to current_line. We'll split on bullets later.
            current_line.append(line)
            
    if current_line:
        cleaned_lines.append(' '.join(current_line))

    with open('clean_events.txt', 'w', encoding='utf-8') as f:
        for l in cleaned_lines:
            f.write(l + '\n')

clean_text()
