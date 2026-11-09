# Result figure videos

Remotion source for the animated figures in the site's Experimental Results section.
All chart data and animation lives in `src/Figures.tsx`.

```bash
npm i
npx remotion studio
```

Render one figure into the site (swap `-` for `_` in the file name):

```bash
npx remotion render f1-by-rho ../static/videos/f1_by_rho.mp4 --image-format=png
```

The 18-second overview video is the `explainer` composition (`src/Explainer.tsx`). Its images are real OpenCV skill outputs from `make_explainer_assets.py`.

Compositions: `explainer`, `f1-by-rho`, `ended-rate`, `relation-quality`, `screening-tradeoff`, `candidate-growth`, `cache-footprint`.
