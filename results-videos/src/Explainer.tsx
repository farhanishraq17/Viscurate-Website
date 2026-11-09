import { loadFont } from "@remotion/google-fonts/GoogleSans";
import { loadFont as loadMono } from "@remotion/google-fonts/NotoSansMono";
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
import { ACCENT, INK, MUTED, POP, useClock } from "./Figures";

const { fontFamily } = loadFont("normal", { weights: ["400", "700"], subsets: ["latin"] });
const { fontFamily: mono } = loadMono("normal", { weights: ["500"], subsets: ["latin"] });

const BLUE = "#2a78d6";
const ORANGE = "#d55e00";
const SWING = Easing.inOut(Easing.cubic);
const DESCRIPTION = "Smooths an image by averaging nearby pixels.";

// Kernel grid and the measured mean |gaussian - box| over the three probes (make_explainer_assets.py).
const KS = [3, 7, 15, 31, 51];
const DIFFS = [0.25, 1.31, 3.37, 6.29, 8.28];

const Tile: React.FC<{ src: string; x?: number; y?: number; size: number; border?: string; opacity?: number }> = ({ src, x, y, size, border, opacity }) => (
  <Img
    src={staticFile(`explainer/${src}.jpg`)}
    style={{
      position: x === undefined ? "static" : "absolute",
      left: x,
      top: y,
      width: size,
      height: size,
      borderRadius: 14,
      border: border ? `5px solid ${border}` : undefined,
      boxSizing: "border-box",
      opacity,
    }}
  />
);

const Caption: React.FC<{ parts: { text: string; at: number; accent?: boolean }[]; dur: number }> = ({ parts, dur }) => {
  const { at } = useClock();
  return (
    <div style={{ position: "absolute", top: 58, width: "100%", display: "flex", justifyContent: "center", gap: 24, fontSize: 80, fontWeight: 700, opacity: 1 - at(dur - 0.3, 0.3) }}>
      {parts.map((p, i) => (
        <span key={i} style={{ color: p.accent ? ACCENT : INK, opacity: at(p.at, 0.4), translate: `0 ${(1 - at(p.at, 0.5)) * 26}px` }}>
          {p.text}
        </span>
      ))}
    </div>
  );
};

const SkillCard: React.FC<{
  name: string;
  color: string;
  cx: number;
  cy: number;
  scale: number;
  children: React.ReactNode;
}> = ({ name, color, cx, cy, scale, children }) => (
  <div style={{ position: "absolute", left: cx, top: cy, scale }}>
    <div style={{ position: "absolute", left: -360, top: -180, width: 720, height: 360, boxSizing: "border-box", background: "#fff", border: `4px solid ${color}`, borderRadius: 28, overflow: "hidden", boxShadow: "0 16px 44px rgba(0,0,0,0.10)" }}>
      <div style={{ background: color, color: "#fff", padding: "20px 36px", fontFamily: mono, fontWeight: 500, fontSize: 48 }}>{name}</div>
      <div style={{ padding: "34px 36px", fontSize: 50, lineHeight: 1.3, color: INK }}>{children}</div>
    </div>
  </div>
);

const Problem: React.FC = () => {
  const { at } = useClock();
  const mark = at(0.9, 0.6, SWING);
  const highlight: React.CSSProperties = {
    backgroundImage: "linear-gradient(#ffe58a, #ffe58a)",
    backgroundRepeat: "no-repeat",
    backgroundSize: `${mark * 100}% 100%`,
  };
  const inA = at(0.05, 0.5);
  const inB = at(0.2, 0.5);
  return (
    <AbsoluteFill>
      <Caption dur={3} parts={[{ text: "Similar descriptions.", at: 0.15 }, { text: "Different behavior?", at: 1.5, accent: true }]} />
      <div style={{ opacity: inA }}>
        <SkillCard name="gaussian_blur" color={BLUE} cx={510 - (1 - inA) * 60} cy={570} scale={1}>
          <span style={highlight}>{DESCRIPTION}</span>
        </SkillCard>
      </div>
      <div style={{ opacity: inB }}>
        <SkillCard name="box_blur" color={ORANGE} cx={1410 + (1 - inB) * 60} cy={570} scale={1}>
          <span style={highlight}>{DESCRIPTION}</span>
        </SkillCard>
      </div>
      <div style={{ position: "absolute", left: 860, width: 200, top: 490, textAlign: "center", fontSize: 150, lineHeight: "160px", fontWeight: 700, color: ACCENT, scale: at(1.65, 0.45, POP), opacity: 1 - at(2.75, 0.25) }}>?</div>
    </AbsoluteFill>
  );
};

const Execution: React.FC = () => {
  const { t, at } = useClock();
  const move = at(0, 0.65, SWING);
  const descFade = 1 - at(0.5, 0.3);
  const rows = [
    { cy: 425, name: "gaussian_blur", color: BLUE, fromX: 510, kind: "g" },
    { cy: 795, name: "box_blur", color: ORANGE, fromX: 1410, kind: "b" },
  ];
  const probeY = [250, 500, 750];
  const P = 190;
  const start = (i: number) => 0.85 + i * 0.92;
  const active = [0, 1, 2].filter((i) => t >= start(i) + 0.4).length - 1;
  const progress = active < 0 ? 0 : at(start(active) + 0.4, 0.3, Easing.linear);
  const barOpacity = at(0.75, 0.2);
  return (
    <AbsoluteFill>
      <Caption dur={4} parts={[{ text: "Don’t trust descriptions.", at: 0.15 }, { text: "Test execution.", at: 0.85, accent: true }]} />
      <div style={{ position: "absolute", left: 90, width: 230, top: 196, textAlign: "center", fontSize: 36, color: MUTED, opacity: at(0.4, 0.4) }}>Same inputs</div>
      {probeY.map((y, i) => (
        <Tile key={i} src={`p${i}`} x={110 + (1 - at(0.3 + i * 0.1, 0.5)) * -50} y={y} size={P} border={t >= start(i) && t < start(i) + 0.95 ? ACCENT : "#ddd"} opacity={at(0.3 + i * 0.1, 0.4)} />
      ))}
      {rows.map((r) => (
        <React.Fragment key={r.name}>
          <SkillCard name={r.name} color={r.color} cx={interpolate(move, [0, 1], [r.fromX, 960])} cy={interpolate(move, [0, 1], [570, r.cy])} scale={interpolate(move, [0, 1], [1, 0.72])}>
            <div style={{ position: "absolute", width: 648, opacity: descFade }}>
              <span style={{ background: "#ffe58a", textDecoration: t > 0.3 ? "line-through" : undefined, textDecorationColor: ACCENT }}>{DESCRIPTION}</span>
            </div>
            <div style={{ opacity: barOpacity, marginTop: 34 }}>
              <div style={{ fontFamily: mono, fontWeight: 500, fontSize: 40, color: MUTED, marginBottom: 20 }}>executing…</div>
              <div style={{ height: 22, borderRadius: 11, background: "#eee", overflow: "hidden" }}>
                <div style={{ height: 22, width: `${progress * 100}%`, background: r.color }} />
              </div>
            </div>
          </SkillCard>
          <div style={{ position: "absolute", left: 1370, top: r.cy - 122, fontSize: 36, color: MUTED, opacity: at(0.7, 0.4) }}>Outputs</div>
          {[0, 1, 2].map((i) => {
            const go = at(start(i), 0.42, SWING);
            const out = at(start(i) + 0.68, 0.3, SWING);
            const inputSize = interpolate(go, [0, 1], [100, 60]);
            const outSize = interpolate(out, [0, 1], [60, 140]);
            const outCx = interpolate(out, [0, 1], [1220, 1370 + i * 154 + 70]);
            return (
              <React.Fragment key={i}>
                <Tile src={`p${i}`} x={interpolate(go, [0, 1], [205, 700]) - inputSize / 2} y={interpolate(go, [0, 1], [probeY[i] + P / 2, r.cy]) - inputSize / 2} size={inputSize} opacity={at(start(i), 0.08) - at(start(i) + 0.38, 0.08)} />
                <Tile src={`p${i}_${r.kind}_15`} x={outCx - outSize / 2} y={r.cy - outSize / 2} size={outSize} border={r.color} opacity={at(start(i) + 0.68, 0.08)} />
              </React.Fragment>
            );
          })}
        </React.Fragment>
      ))}
    </AbsoluteFill>
  );
};

const Compare: React.FC = () => {
  const { t, at } = useClock();
  const ticks = [0, 1.2, 1.8, 2.4, 3.0];
  const k = ticks.filter((x) => t >= x).length - 1;
  const rows = [
    { kind: "g", label: "gaussian_blur", color: BLUE },
    { kind: "b", label: "box_blur", color: ORANGE },
    { kind: "d", label: "difference", color: INK },
  ];
  const T = 222;
  const colX = [390, 628, 866];
  const rowY = [208, 446, 684];
  const L = 1210;
  const STEP = 130;
  const tickX = (j: number) => L + j * STEP;
  const handleX = interpolate(t, ticks.flatMap((x) => [x, x + 0.25]), ticks.flatMap((_, j) => [tickX(Math.max(j - 1, 0)), tickX(j)]), { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: SWING });
  const BASE = 830;
  const worst = at(3.4, 0.4);
  return (
    <AbsoluteFill style={{ opacity: at(0, 0.3) * (1 - at(4.7, 0.3)) }}>
      <Caption dur={5} parts={[{ text: "Compare", at: 0.1 }, { text: "observed behavior.", at: 0.4, accent: true }]} />
      {rows.map((r, ri) => (
        <div key={r.kind} style={{ position: "absolute", left: 40, width: 320, top: rowY[ri] + T / 2 - 30, textAlign: "right", fontFamily: ri < 2 ? mono : fontFamily, fontWeight: ri < 2 ? 500 : 700, fontSize: 36, color: r.color }}>
          {r.label}
          {ri === 2 ? <div style={{ fontFamily, fontWeight: 400, fontSize: 28, color: MUTED }}>amplified ×4</div> : null}
        </div>
      ))}
      {rows.flatMap((r, ri) =>
        colX.map((x, pi) => <Tile key={`${r.kind}${pi}`} src={`p${pi}_${r.kind}_${KS[k]}`} x={x} y={rowY[ri]} size={T} opacity={at(0.1 + pi * 0.08 + ri * 0.08, 0.35)} />),
      )}
      <div style={{ position: "absolute", left: L - 30, top: 210, fontSize: 42, fontWeight: 700, opacity: at(0.3, 0.4) }}>
        Same parameter grid
        <div style={{ fontSize: 32, fontWeight: 400, color: MUTED }}>kernel size <i>k</i></div>
      </div>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }} fill={INK} fontFamily={fontFamily}>
        <g opacity={at(0.4, 0.4)}>
          <line x1={tickX(0)} x2={tickX(4)} y1={362} y2={362} stroke="#ddd" strokeWidth={8} strokeLinecap="round" />
          {KS.map((v, j) => (
            <g key={v}>
              <circle cx={tickX(j)} cy={362} r={9} fill={j <= k ? ACCENT : "#bbb"} />
              <text x={tickX(j)} y={420} fontSize={36} textAnchor="middle" fontWeight={j === k ? 700 : 400}>{v}</text>
            </g>
          ))}
          <circle cx={handleX} cy={362} r={21} fill={ACCENT} />
          <text x={L - 30} y={496} fontSize={36} fontWeight={700}>Output difference</text>
          <line x1={L - 60} x2={tickX(4) + 60} y1={BASE} y2={BASE} stroke={INK} strokeWidth={3} />
        </g>
        {KS.map((v, j) => {
          const h = (DIFFS[j] / DIFFS[4]) * 280 * at(ticks[j] + 0.05, 0.4);
          return <rect key={v} x={tickX(j) - 46} y={BASE - h} width={92} height={h} rx={6} fill={j === 4 && worst > 0 ? ACCENT : "#c9c9c9"} />;
        })}
        <text x={tickX(4)} y={BASE - 296} fontSize={32} fontWeight={700} textAnchor="middle" fill={ACCENT} opacity={worst}>worst case</text>
        <text x={1485} y={906} fontSize={34} fontWeight={700} textAnchor="middle" opacity={at(3.5, 0.4)}>Agree at small kernels, diverge at large ones.</text>
      </svg>
    </AbsoluteFill>
  );
};

const RELATIONS = [
  { name: "Exact", sym: "=", file: "exact", action: "Merge", color: "#3d8b5a", bg: "#eef8f1", ink: "#2f6e47" },
  { name: "Perceptual", sym: "≈", file: "perceptual", action: "Merge", color: "#3d8b5a", bg: "#eef8f1", ink: "#2f6e47" },
  { name: "Subsumption", sym: "⊆", file: "subsumption", action: "Parameterize", color: "#d38300", bg: "#fff7e8", ink: "#9a5f00" },
  { name: "Semantic-preserving", sym: "≡", file: "semantic", action: "Parameterize, never merge", color: "#d38300", bg: "#fff7e8", ink: "#9a5f00" },
  { name: "Complementary", sym: "⊕", file: "complementary", action: "Advisory only", color: "#4a7ea9", bg: "#f2f6fa", ink: "#3a6890" },
  { name: "Distinct", sym: "≠", file: "distinct", action: "Keep separate", color: "#c54a4a", bg: "#fdeeee", ink: "#a63b3b" },
];

const Relations: React.FC = () => {
  const { at } = useClock();
  return (
    <AbsoluteFill style={{ opacity: at(0, 0.3) * (1 - at(3.7, 0.3)) }}>
      <Caption dur={4} parts={[{ text: "Identify", at: 0.1 }, { text: "behavioral relationships.", at: 0.35, accent: true }]} />
      {RELATIONS.map((r, i) => {
        const start = 0.35 + i * 0.28;
        return (
          <div
            key={r.name}
            style={{
              position: "absolute",
              left: 90 + (i % 3) * 590,
              top: 200 + Math.floor(i / 3) * 366,
              width: 560,
              height: 340,
              boxSizing: "border-box",
              background: r.bg,
              border: `3px solid ${r.color}`,
              borderRadius: 24,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 0 18px",
              opacity: at(start, 0.25),
              scale: interpolate(at(start, 0.45, POP), [0, 1], [0.88, 1]),
            }}
          >
            <div style={{ fontSize: 42, fontWeight: 700, color: r.ink }}>{r.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <Tile src={`rel_${r.file}_a`} size={172} />
              <div style={{ width: 76, height: 76, borderRadius: 38, background: r.color, color: "#fff", fontSize: 50, fontWeight: 700, lineHeight: "72px", textAlign: "center" }}>{r.sym}</div>
              <Tile src={`rel_${r.file}_b`} size={172} />
            </div>
            <div style={{ padding: "4px 26px", borderRadius: 999, background: "#fff", border: `2px solid ${r.color}`, fontSize: 32, fontWeight: 700, color: r.ink }}>{r.action}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Reveal: React.FC = () => {
  const { at } = useClock();
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}>
      <div style={{ fontSize: 190, fontWeight: 700, fontVariant: "small-caps", color: INK, lineHeight: 1.15, opacity: at(0.15, 0.4), translate: `0 ${(1 - at(0.15, 0.5)) * 30}px` }}>VisCurate</div>
      <div style={{ width: 260 * at(0.5, 0.5), height: 8, borderRadius: 4, background: ACCENT, margin: "10px 0 34px" }} />
      <div style={{ fontSize: 64, color: INK, opacity: at(0.6, 0.45) }}>Behavioral Equivalence of Visual Skills</div>
    </AbsoluteFill>
  );
};

export const Explainer: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "#fff", fontFamily }}>
      <Sequence name="The problem" durationInFrames={3 * fps}><Problem /></Sequence>
      <Sequence name="Execution" from={3 * fps} durationInFrames={4 * fps}><Execution /></Sequence>
      <Sequence name="Output comparison" from={7 * fps} durationInFrames={5 * fps}><Compare /></Sequence>
      <Sequence name="Relationships" from={12 * fps} durationInFrames={4 * fps}><Relations /></Sequence>
      <Sequence name="Project reveal" from={16 * fps} durationInFrames={2 * fps}><Reveal /></Sequence>
    </AbsoluteFill>
  );
};
