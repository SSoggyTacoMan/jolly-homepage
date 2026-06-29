import os
import random

OUT_DIR = "/Users/maaren/snowtab/wallpapers"

NAMES = [
    "00-santa-village.svg", "01-santa-sleigh.svg", "02-north-pole.svg",
    "03-cozy-cabin.svg", "04-toy-workshop.svg", "05-reindeer-night.svg",
    "06-christmas-town.svg", "07-fireplace.svg", "08-snowman-yard.svg",
    "09-winter-train.svg", "10-christmas-market.svg", "11-rooftops.svg"
]

def make_snow(x, y, r, opacity):
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="#FFFFFF" opacity="{opacity}"/>'

def make_jolly_tree(x, y, scale):
    out = f'<g transform="translate({x},{y}) scale({scale})">'
    # Trunk
    out += '<rect x="-6" y="-10" width="12" height="20" fill="#795548" rx="2"/>'
    # Tree tiers
    out += '<path d="M -40 -10 L 40 -10 L 0 -50 Z" fill="#2E7D32"/>'
    out += '<path d="M -30 -30 L 30 -30 L 0 -70 Z" fill="#43A047"/>'
    out += '<path d="M -20 -50 L 20 -50 L 0 -90 Z" fill="#4CAF50"/>'
    # Ornaments
    colors = ["#F44336", "#FFEB3B", "#29B6F6", "#AB47BC", "#FF9800"]
    for cx, cy in [(-15, -20), (10, -25), (-5, -40), (15, -45), (-10, -60), (0, -30), (20, -15), (-25, -12)]:
        c = random.choice(colors)
        out += f'<circle cx="{cx}" cy="{cy}" r="3.5" fill="{c}"/>'
    # Star
    out += '<polygon points="0,-95 3,-85 12,-85 5,-80 8,-70 0,-76 -8,-70 -5,-80 -12,-85 -3,-85" fill="#FFC107"/>'
    out += '</g>'
    return out

def make_candy_cane(x, y, scale, rotation):
    out = f'<g transform="translate({x},{y}) scale({scale}) rotate({rotation})">'
    out += '<path d="M 0 0 L 0 -30 A 10 10 0 0 1 20 -30 L 20 -20" fill="none" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round"/>'
    out += '<path d="M 0 -5 L 0 -15" stroke="#F44336" stroke-width="8"/>'
    out += '<path d="M 0 -25 A 10 10 0 0 1 10 -40" stroke="#F44336" stroke-width="8" fill="none"/>'
    out += '<path d="M 20 -30 L 20 -25" stroke="#F44336" stroke-width="8"/>'
    out += '</g>'
    return out

def make_gift(x, y, scale):
    out = f'<g transform="translate({x},{y}) scale({scale})">'
    colors = [("#F44336", "#FFEB3B"), ("#2196F3", "#F44336"), ("#9C27B0", "#00E676")]
    box, ribbon = random.choice(colors)
    out += f'<rect x="-15" y="-30" width="30" height="30" fill="{box}" rx="2"/>'
    out += f'<rect x="-4" y="-30" width="8" height="30" fill="{ribbon}"/>'
    out += f'<rect x="-15" y="-19" width="30" height="8" fill="{ribbon}"/>'
    # Bow
    out += f'<path d="M -2 -30 C -15 -45 0 -45 0 -30 Z" fill="{ribbon}"/>'
    out += f'<path d="M 2 -30 C 15 -45 0 -45 0 -30 Z" fill="{ribbon}"/>'
    out += '</g>'
    return out

def make_snowman(x, y, scale):
    out = f'<g transform="translate({x},{y}) scale({scale})">'
    out += '<circle cx="0" cy="-20" r="20" fill="#FFFFFF"/>'
    out += '<circle cx="0" cy="-55" r="16" fill="#FFFFFF"/>'
    out += '<circle cx="0" cy="-85" r="12" fill="#FFFFFF"/>'
    # Hat
    out += '<rect x="-15" y="-95" width="30" height="4" fill="#212121" rx="2"/>'
    out += '<rect x="-10" y="-115" width="20" height="20" fill="#212121"/>'
    out += '<rect x="-10" y="-99" width="20" height="4" fill="#F44336"/>'
    # Face
    out += '<circle cx="-4" cy="-87" r="1.5" fill="#212121"/>'
    out += '<circle cx="4" cy="-87" r="1.5" fill="#212121"/>'
    out += '<path d="M 0 -83 L 15 -78 L 0 -77 Z" fill="#FF9800"/>'
    # Scarf
    out += '<path d="M -12 -70 Q 0 -65 12 -70 L 14 -60 Q 0 -55 -14 -60 Z" fill="#F44336"/>'
    out += '<path d="M 8 -65 L 12 -45 L 6 -45 Z" fill="#F44336"/>'
    # Buttons
    out += '<circle cx="0" cy="-60" r="1.5" fill="#212121"/>'
    out += '<circle cx="0" cy="-50" r="1.5" fill="#212121"/>'
    out += '<circle cx="0" cy="-25" r="2" fill="#212121"/>'
    out += '<circle cx="0" cy="-10" r="2" fill="#212121"/>'
    out += '</g>'
    return out

def make_jolly_cabin(x, y, scale):
    out = f'<g transform="translate({x},{y}) scale({scale})">'
    # Base
    out += '<rect x="-40" y="-40" width="80" height="40" fill="#795548"/>'
    # Door
    out += '<rect x="-10" y="-20" width="20" height="20" fill="#FF9800" rx="2"/>'
    out += '<circle cx="6" cy="-10" r="2" fill="#FFE082"/>'
    # Windows
    out += '<rect x="-30" y="-25" width="12" height="12" fill="#FFF59D" rx="1"/>'
    out += '<rect x="18" y="-25" width="12" height="12" fill="#FFF59D" rx="1"/>'
    # Wreath on door
    out += '<circle cx="0" cy="-10" r="4" fill="none" stroke="#4CAF50" stroke-width="2"/>'
    out += '<circle cx="0" cy="-14" r="1" fill="#F44336"/>'
    # Roof
    out += '<path d="M -50 -40 L 0 -80 L 50 -40 Z" fill="#D32F2F"/>'
    # Snow on roof
    out += '<path d="M -50 -40 L 0 -80 L 50 -40" fill="none" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>'
    out += '</g>'
    return out

def generate_svg(index):
    random.seed(index * 999)
    name = NAMES[index]
    
    # Randomly pick Bright Day, Magical Evening, or Jolly Night
    time = random.choice(["day", "evening", "night"])
    if "night" in name or "rooftops" in name: time = "night"
    if "day" in name or "snowman" in name or index == 0: time = "day"
    
    if time == "day":
        bg1, bg2 = "#64B5F6", "#E3F2FD"
        sun_moon = '<circle cx="1300" cy="200" r="80" fill="#FFEB3B" opacity="0.9"/>'
    elif time == "evening":
        bg1, bg2 = "#9C27B0", "#FF4081"
        sun_moon = '<circle cx="1300" cy="200" r="80" fill="#FFD54F" opacity="0.9"/>'
    else:
        bg1, bg2 = "#1A237E", "#3949AB"
        sun_moon = '<circle cx="1300" cy="200" r="60" fill="#FFF9C4" opacity="0.9"/><circle cx="1300" cy="200" r="120" fill="#FFF9C4" opacity="0.1"/>'

    svg = []
    svg.append('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">')
    svg.append('<defs>')
    svg.append(f'<linearGradient id="bg{index}" x1="0" y1="0" x2="0" y2="1">')
    svg.append(f'<stop offset="0%" stop-color="{bg1}"/>')
    svg.append(f'<stop offset="100%" stop-color="{bg2}"/>')
    svg.append('</linearGradient>')
    svg.append(f'<linearGradient id="hill1{index}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="100%" stop-color="#E3F2FD"/></linearGradient>')
    svg.append(f'<linearGradient id="hill2{index}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#F5F5F5"/><stop offset="100%" stop-color="#BBDEFB"/></linearGradient>')
    svg.append('</defs>')
    
    svg.append(f'<rect width="1600" height="900" fill="url(#bg{index})"/>')
    svg.append(sun_moon)
    
    if time != "day":
        for _ in range(50):
            svg.append(make_snow(random.randint(0, 1600), random.randint(0, 500), random.uniform(1, 3), random.uniform(0.3, 0.8)))

    # Distant hills
    svg.append(f'<path d="M 0 600 Q 400 450 800 600 T 1600 550 L 1600 900 L 0 900 Z" fill="url(#hill2{index})"/>')
    
    # Midground trees
    for _ in range(8):
        tx = random.randint(100, 1500)
        svg.append(make_jolly_tree(tx, random.randint(580, 650), random.uniform(0.8, 1.2)))
        
    # Foreground hill
    svg.append(f'<path d="M 0 700 Q 600 550 1200 750 T 1600 650 L 1600 900 L 0 900 Z" fill="url(#hill1{index})"/>')

    # Foreground elements based on theme
    if "village" in name or "town" in name or "rooftops" in name or "market" in name:
        for _ in range(4):
            svg.append(make_jolly_cabin(random.randint(200, 1400), random.randint(680, 750), random.uniform(1.5, 2.5)))
        for _ in range(5):
            svg.append(make_jolly_tree(random.randint(100, 1500), random.randint(700, 800), random.uniform(1.2, 1.8)))
            
    elif "cabin" in name or "fireplace" in name or "workshop" in name:
        svg.append(make_jolly_cabin(800, 750, 4.0))
        svg.append(make_jolly_tree(500, 780, 2.0))
        svg.append(make_jolly_tree(1100, 760, 1.8))
        svg.append(make_snowman(1000, 820, 1.5))
        svg.append(make_gift(650, 800, 1.2))
        svg.append(make_gift(700, 810, 0.9))
        
    else: # snowmen, reindeer, train, etc
        for _ in range(3):
            svg.append(make_snowman(random.randint(200, 1400), random.randint(700, 850), random.uniform(1.5, 2.5)))
        for _ in range(6):
            svg.append(make_jolly_tree(random.randint(100, 1500), random.randint(700, 800), random.uniform(1.5, 2.5)))
        for _ in range(5):
            svg.append(make_gift(random.randint(100, 1500), random.randint(750, 850), random.uniform(0.8, 1.5)))
            svg.append(make_candy_cane(random.randint(100, 1500), random.randint(750, 850), random.uniform(0.8, 1.5), random.randint(-20, 20)))

    # Foreground snow falling
    for _ in range(150):
        svg.append(make_snow(random.randint(0, 1600), random.randint(0, 900), random.uniform(2, 6), random.uniform(0.5, 0.9)))

    svg.append('</svg>')
    return "".join(svg)

os.makedirs(OUT_DIR, exist_ok=True)
for i, name in enumerate(NAMES):
    path = os.path.join(OUT_DIR, name)
    with open(path, "w") as f:
        f.write(generate_svg(i))
    print(f"Generated jolly {name}")
