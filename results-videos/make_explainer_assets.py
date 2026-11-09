"""Generate the real OpenCV skill outputs used by the explainer video (src/Explainer.tsx).

Run from results-videos/:  python make_explainer_assets.py
"""
from pathlib import Path

import cv2
import numpy as np

OUT = Path(__file__).parent / "public" / "explainer"
OUT.mkdir(parents=True, exist_ok=True)
S = 360
KS = [3, 7, 15, 31, 51]  # the matched parameter grid shown in the video
DIFF_GAIN = 4


def canvas(color):
    return np.full((S * 4, S * 4, 3), color, np.uint8)


def down(img):
    return cv2.resize(img, (S, S), interpolation=cv2.INTER_AREA)


def landscape():
    img = canvas((0, 0, 0))
    for y in range(img.shape[0]):
        f = y / img.shape[0]
        img[y] = (235 - 60 * f, 190 - 20 * f, 120 + 110 * f)
    c = S * 4
    cv2.circle(img, (int(c * 0.74), int(c * 0.26)), int(c * 0.1), (60, 200, 255), -1)
    cv2.fillPoly(img, [np.array([[0, c], [0, int(c * .62)], [int(c * .3), int(c * .34)], [int(c * .58), int(c * .68)], [int(c * .58), c]])], (120, 95, 80))
    cv2.fillPoly(img, [np.array([[int(c * .3), c], [int(c * .68), int(c * .46)], [c, int(c * .72)], [c, c]])], (95, 125, 70))
    cv2.rectangle(img, (0, int(c * .84)), (c, c), (70, 150, 75), -1)
    cv2.rectangle(img, (int(c * .2), int(c * .7)), (int(c * .23), int(c * .86)), (40, 60, 95), -1)
    cv2.circle(img, (int(c * .215), int(c * .66)), int(c * .075), (55, 135, 55), -1)
    return down(img)


def lights():
    img = canvas((30, 18, 18))
    c = S * 4
    rng = np.random.default_rng(7)
    colors = [(90, 220, 255), (255, 200, 120), (140, 150, 255), (255, 255, 255), (130, 255, 180)]
    for ix in range(4):
        for iy in range(4):
            x = int((ix + .5 + rng.uniform(-.15, .15)) * c / 4)
            y = int((iy + .5 + rng.uniform(-.15, .15)) * c / 4)
            cv2.circle(img, (x, y), 58, colors[(ix + iy * 2) % 5], -1, cv2.LINE_AA)
    return down(img)


def shapes():
    img = canvas((250, 250, 250))
    c = S * 4
    cv2.rectangle(img, (int(c * .1), int(c * .12)), (int(c * .44), int(c * .46)), (180, 90, 30), -1)
    cv2.circle(img, (int(c * .72), int(c * .3)), int(c * .18), (40, 70, 215), -1, cv2.LINE_AA)
    cv2.fillPoly(img, [np.array([[int(c * .12), int(c * .9)], [int(c * .3), int(c * .56)], [int(c * .48), int(c * .9)]])], (70, 170, 60), cv2.LINE_AA)
    for i in range(6):
        x = int(c * (.58 + i * .065))
        cv2.line(img, (x, int(c * .58)), (x, int(c * .9)), (30, 30, 30), 18)
    return down(img)


probes = [landscape(), lights(), shapes()]


def save(name, img):
    cv2.imwrite(str(OUT / f"{name}.jpg"), img, [cv2.IMWRITE_JPEG_QUALITY, 93])


mean_diff = {k: [] for k in KS}
for p, img in enumerate(probes):
    save(f"p{p}", img)
    for k in KS:
        gaussian = cv2.GaussianBlur(img, (k, k), 0)
        box = cv2.blur(img, (k, k))
        diff = cv2.absdiff(gaussian, box)
        mean_diff[k].append(float(diff.mean()))
        save(f"p{p}_g_{k}", gaussian)
        save(f"p{p}_b_{k}", box)
        save(f"p{p}_d_{k}", np.clip(diff.astype(int) * DIFF_GAIN, 0, 255).astype(np.uint8))

print("mean |gaussian - box| per probe (0-255) and average, by kernel:")
for k, v in mean_diff.items():
    print(k, [round(x, 2) for x in v], round(sum(v) / len(v), 2))

scene, _, shape = probes
blur = cv2.GaussianBlur(scene, (15, 15), 0)
save("rel_exact_a", blur)
save("rel_exact_b", blur.copy())

save("rel_perceptual_a", scene)
ok, buf = cv2.imencode(".jpg", scene, [cv2.IMWRITE_JPEG_QUALITY, 80])
save("rel_perceptual_b", cv2.imdecode(buf, cv2.IMREAD_COLOR))


def rotated(img, deg):
    return cv2.warpAffine(img, cv2.getRotationMatrix2D((S / 2, S / 2), -deg, 1), (S, S), borderMode=cv2.BORDER_REPLICATE)


save("rel_subsumption_a", rotated(scene, 90))
angles = [0, 45, 90, 135]
tiles = [cv2.resize(rotated(scene, a), (S // 2 - 6, S // 2 - 6), interpolation=cv2.INTER_AREA) for a in angles]
grid = np.full((S, S, 3), 255, np.uint8)
for i, tile in enumerate(tiles):
    x, y = (i % 2) * (S // 2) + 3, (i // 2) * (S // 2) + 3
    grid[y : y + tile.shape[0], x : x + tile.shape[1]] = tile
    if angles[i] == 90:
        cv2.rectangle(grid, (x, y), (x + tile.shape[1] - 1, y + tile.shape[0] - 1), (0, 131, 211), 7)
save("rel_subsumption_b", grid)

gray = cv2.cvtColor(shape, cv2.COLOR_BGR2GRAY)
save("rel_semantic_a", 255 - cv2.Canny(gray, 60, 160))
sx, sy = cv2.Sobel(gray, cv2.CV_32F, 1, 0), cv2.Sobel(gray, cv2.CV_32F, 0, 1)
save("rel_semantic_b", 255 - np.clip(cv2.magnitude(sx, sy) / 3, 0, 255).astype(np.uint8))

binary = (gray < 200).astype(np.uint8) * 255
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (19, 19))
save("rel_complementary_a", 255 - cv2.dilate(binary, kernel))
save("rel_complementary_b", 255 - cv2.erode(binary, kernel))

save("rel_distinct_a", cv2.GaussianBlur(scene, (31, 31), 0))
scene_gray = cv2.cvtColor(scene, cv2.COLOR_BGR2GRAY)
save("rel_distinct_b", cv2.threshold(scene_gray, 128, 255, cv2.THRESH_BINARY)[1])
