"""Build static/images/overview_anim.svg: the overview diagram, revealed element by element.

    python scripts/animate_overview.py [path/to/mainDiagram.pdf]

Needs pdftocairo (poppler / MiKTeX). Each SVG element joins the smallest STEPS box that contains it;
steps fade in one after another, the full diagram holds, then the loop restarts.
If the diagram layout changes, update the STEPS boxes (PDF points, origin top-left).
"""
import re
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PDF = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "VisCurate_Paper_Contents/figures/mainDiagramV3.2.pdf"
OUT = ROOT / "static/images/overview_anim.svg"

GAP, FADE, HOLD, END = 0.75, 0.8, 8.0, 1.0  # seconds: between steps, per-step fade, full-diagram hold, fade-out

# (x0, y0, x1, y1) in reveal order. None = always visible.
STEPS = [
    None,                                 # page background (clip group, always visible)
    (6, 5, 390, 123),                     # panel (a) frame + title
    (298, 10, 388, 22),                   # legend
    (14, 31, 76, 111),                    # Candidate pair box
    (17, 56, 46, 96),                     #   skill library L_t
    (47, 53, 69, 71),                     #   S_A
    (47, 75, 69, 92),                     #   S_B
    (30, 96, 60, 106),                    #   S_A, S_B in L_t
    (74, 66, 86, 76),                     # arrow -> shared probes
    (83, 31, 257, 111),                   # Shared probe execution box
    (89, 53, 129, 96),                    #   image probes
    (128, 62, 140, 86),                   #   fork
    (138, 55, 187, 73),                   #   Run S_A
    (138, 75, 187, 93),                   #   Run S_B
    (186, 62, 196, 88),                   #   arrows -> outputs
    (194, 55, 250, 73),                   #   Y_A
    (194, 75, 250, 93),                   #   Y_B
    (247, 62, 254, 105),                  #   bracket -> comparison
    (138, 96, 250, 108),                  #   per-setting comparison d_k
    (255, 66, 267, 76),                   # arrow -> assign relation
    (264, 31, 382, 111),                  # Assign a relation box
    (282, 57, 364, 65),                   #   = exact
    (282, 65, 364, 72.5),                 #   ~ perceptual
    (282, 72.5, 364, 80.3),               #   subsumption
    (282, 80.3, 364, 87.7),               #   semantic-preserving
    (282, 87.7, 364, 95.3),               #   complementary
    (282, 95.3, 364, 103),                #   distinct
    (6, 128, 390, 239),                   # panel (b) frame + title
    (14, 163, 68, 214),                   # LLM curator
    (66, 183, 79, 194),                   # arrow -> proposed action
    (76, 156, 194, 221),                  # Proposed action box
    (83, 176, 192, 188.5),                #   Consolidate
    (83, 189.5, 192, 201.5),              #   Refine
    (83, 202.5, 192, 215),                #   Control
    (192, 183, 208, 194),                 # arrow -> edit verification
    (240, 108, 326, 162),                 # r_AB relation from (a)
    (205, 159, 286, 218),                 # Edit verification
    (284, 183, 297, 194),                 # arrow -> update library
    (295, 163, 382, 214),                 # Update library
    (36, 212, 340, 232),                  # next iteration loop
]
TOL = 0.8

SVG, XLINK = "http://www.w3.org/2000/svg", "http://www.w3.org/1999/xlink"
ET.register_namespace("", SVG)
ET.register_namespace("xlink", XLINK)


def points(el):
    """Rough outline points of an element: path coordinates (cairo emits absolute pairs) or glyph origins."""
    tag = el.tag.split("}")[1]
    if tag == "path":
        n = [float(v) for v in re.findall(r"-?[\d.]+(?:e-?\d+)?", el.get("d", ""))]
        pts = list(zip(n[::2], n[1::2]))
        if el.get("transform"):
            a, b, c, d, e, f = map(float, re.findall(r"-?[\d.]+", el.get("transform")))
            pts = [(a * x + c * y + e, b * x + d * y + f) for x, y in pts]
        return pts
    if tag == "use":
        return [(float(el.get("x")), float(el.get("y")))]
    return [p for ch in el for p in points(ch)]


def step_of(el):
    pts = points(el)
    x0, y0 = min(p[0] for p in pts), min(p[1] for p in pts)
    x1, y1 = max(p[0] for p in pts), max(p[1] for p in pts)
    fits = [i for i, r in enumerate(STEPS) if r and r[0] - TOL <= x0 and r[1] - TOL <= y0
            and x1 <= r[2] + TOL and y1 <= r[3] + TOL]
    return min(fits, key=lambda i: (STEPS[i][2] - STEPS[i][0]) * (STEPS[i][3] - STEPS[i][1]), default=None)


with tempfile.TemporaryDirectory() as tmp:
    raw = Path(tmp) / "d.svg"
    subprocess.run(["pdftocairo", "-svg", str(PDF), str(raw)], check=True)
    tree = ET.parse(raw)

svg = tree.getroot()
used = set()
for el in svg:
    tag = el.tag.split("}")[1]
    if tag == "defs" or el.get("clip-path"):  # glyph defs / page background
        continue
    kids = [step_of(u) for u in el] if tag == "g" else []
    if kids and len(set(kids)) > 1:  # a text run spanning several steps: tag glyphs individually
        targets = list(zip(el, kids))
    else:
        targets = [(el, step_of(el))]
    for t, s in targets:
        assert s is not None, f"no step box contains {ET.tostring(t)[:200]}"
        t.set("class", f"s{s}")
        used.add(s)

empty = set(range(1, len(STEPS))) - used
assert not empty, f"step boxes with no elements: {sorted(empty)}"

T = GAP * len(STEPS) + FADE + HOLD + END
pct = lambda t: f"{100 * t / T:.2f}%"
css = [f".s{i}{{animation:k{i} {T:.2f}s ease-out infinite}}"
       f"@keyframes k{i}{{0%,{pct(GAP * i)}{{opacity:0;translate:0 3px}}"
       f"{pct(GAP * i + FADE)},{pct(T - END)}{{opacity:1;translate:0 0}}100%{{opacity:0}}}}"
       for i in sorted(used)]
css.append("@media (prefers-reduced-motion:reduce){[class]{animation:none}}")
style = ET.Element(f"{{{SVG}}}style")
style.text = "\n".join(css)
svg.insert(0, style)

tree.write(OUT, encoding="utf-8", xml_declaration=True)
print(f"{OUT.relative_to(ROOT)}: {len(used)} steps, {T:.1f}s loop")
