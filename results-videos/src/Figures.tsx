import { loadFont } from "@remotion/google-fonts/NotoSans";
import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "700"],
  subsets: ["latin", "greek"],
});
loadFont("italic", { weights: ["400"], subsets: ["latin", "greek"] });

export const INK = "#222";
export const MUTED = "#666";
const GRID = "#e2e2e2";
export const ACCENT = "#8b0000"; // the site's dark red

export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const POP = Easing.bezier(0.34, 1.56, 0.64, 1);

export const useClock = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  // Progress 0..1 of a beat that starts at `start` seconds and lasts `dur`.
  const at = (start: number, dur: number, easing = EASE_OUT) =>
    interpolate(t, [start, start + dur], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing,
    });
  return { t, at };
};

const halo = { paintOrder: "stroke", stroke: "#fff", strokeWidth: 9, strokeLinejoin: "round" } as const;
const Var: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tspan fontStyle="italic">{children}</tspan>
);

type Box = { l: number; t: number; r: number; b: number };
type Tick = { at: number; label: React.ReactNode };
type Kind = "circle" | "square" | "triangle" | "diamond";

const Marker: React.FC<{ kind: Kind; color: string }> = ({ kind, color }) => {
  if (kind === "circle") return <circle r={14} fill={color} />;
  if (kind === "square") return <rect x={-13} y={-13} width={26} height={26} fill={color} />;
  if (kind === "triangle") return <polygon points="0,-17 16,11 -16,11" fill={color} />;
  return <polygon points="0,-18 13,0 0,18 -13,0" fill={color} />;
};

const LineSwatch: React.FC<{ kind: Kind; color: string; dash?: boolean }> = ({ kind, color, dash }) => (
  <svg width={84} height={40} viewBox="-42 -20 84 40">
    <line x1={-42} x2={42} stroke={color} strokeWidth={6} strokeDasharray={dash ? "16 8" : undefined} />
    <Marker kind={kind} color={color} />
  </svg>
);

const BarSwatch: React.FC<{ color: string }> = ({ color }) => (
  <svg width={64} height={34}>
    <rect x={2} y={2} width={60} height={30} fill={color} stroke="#111" strokeWidth={3} />
  </svg>
);

const Figure: React.FC<{
  title: string;
  subtitle: React.ReactNode;
  legend?: { swatch: React.ReactNode; label: React.ReactNode }[];
  children: React.ReactNode;
}> = ({ title, subtitle, legend, children }) => {
  const { at } = useClock();
  return (
    <AbsoluteFill style={{ background: "#fff", fontFamily }}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} fill={INK} style={{ position: "absolute" }}>
        <g textAnchor="middle" opacity={at(0, 0.5)}>
          <text x={960} y={84} fontSize={60} fontWeight={700}>{title}</text>
          <text x={960} y={140} fontSize={36} fill={MUTED}>{subtitle}</text>
        </g>
        {children}
      </svg>
      {legend ? (
        <div style={{ position: "absolute", top: 160, width: "100%", display: "flex", justifyContent: "center", gap: 60 }}>
          {legend.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 36, color: INK, opacity: at(0.3 + i * 0.1, 0.4) }}>
              {item.swatch}
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const Axes: React.FC<{
  box: Box;
  x: Tick[];
  y: Tick[];
  xTitle?: React.ReactNode;
  yTitle?: React.ReactNode;
  yTitleX?: number;
  xTitleY?: number;
  yColor?: string;
  right?: { ticks: Tick[]; title: string; color: string };
  gridX?: boolean;
}> = ({ box: { l, t, r, b }, x, y, xTitle, yTitle, yTitleX = 66, xTitleY = 1000, yColor = INK, right, gridX }) => {
  const { at } = useClock();
  const draw = at(0.1, 0.7);
  const mid = (t + b) / 2;
  return (
    <g>
      {!gridX && y.map((k, i) => (
        <line key={i} x1={l} x2={l + (r - l) * at(0.2 + i * 0.05, 0.7)} y1={k.at} y2={k.at} stroke={GRID} strokeWidth={2} strokeDasharray="12 10" />
      ))}
      {gridX && x.map((k, i) => (
        <line key={i} x1={k.at} x2={k.at} y1={b} y2={b - (b - t) * at(0.2 + i * 0.05, 0.7)} stroke={GRID} strokeWidth={2} strokeDasharray="12 10" />
      ))}
      <line x1={l} x2={l + (r - l) * draw} y1={b} y2={b} stroke={INK} strokeWidth={3} />
      <line x1={l} x2={l} y1={b} y2={b - (b - t) * draw} stroke={INK} strokeWidth={3} />
      {right ? <line x1={r} x2={r} y1={b} y2={b - (b - t) * draw} stroke={INK} strokeWidth={3} /> : null}
      <g opacity={at(0.25, 0.5)} fontSize={38}>
        {x.map((k, i) => (
          <g key={i}>
            <line x1={k.at} x2={k.at} y1={b} y2={b + 10} stroke={INK} strokeWidth={3} />
            <text x={k.at} y={b + 52} textAnchor="middle">{k.label}</text>
          </g>
        ))}
        {y.map((k, i) => (
          <text key={i} x={l - 18} y={k.at + 13} textAnchor="end" fill={yColor}>{k.label}</text>
        ))}
        {right?.ticks.map((k, i) => (
          <text key={i} x={r + 18} y={k.at + 13} fill={right.color}>{k.label}</text>
        ))}
        <g fontSize={44} textAnchor="middle">
          {xTitle ? <text x={(l + r) / 2} y={xTitleY}>{xTitle}</text> : null}
          {yTitle ? <text transform={`translate(${yTitleX} ${mid}) rotate(-90)`} fill={yColor}>{yTitle}</text> : null}
          {right ? <text transform={`translate(1858 ${mid}) rotate(-90)`} fill={right.color}>{right.title}</text> : null}
        </g>
      </g>
    </g>
  );
};

type Series = {
  color: string;
  ink: string;
  kind: Kind;
  dash?: boolean;
  ys: number[];
  values: string[];
  // Offsets for a fixed label beside each point; omit to get one live tag at the line head.
  offsets?: [number, number][];
};

// All series are revealed by one left-to-right sweep; each point pops as the sweep reaches it.
const Lines: React.FC<{ id: string; xs: number[]; series: Series[]; t0: number; dur: number; box?: Box }> = ({ id, xs, series, t0, dur, box }) => {
  const { at } = useClock();
  const x0 = xs[0];
  const x1 = xs[xs.length - 1];
  const sweepX = x0 + (x1 - x0) * at(t0, dur, Easing.linear);
  const pointT = (i: number) => t0 + (dur * (xs[i] - x0)) / (x1 - x0);
  const reached = xs.filter((x) => x <= sweepX + 0.01).length - 1;
  return (
    <g>
      <clipPath id={id}><rect x={0} y={0} width={sweepX} height={1080} /></clipPath>
      {box ? (
        <line x1={sweepX} x2={sweepX} y1={box.t} y2={box.b} stroke={MUTED} strokeWidth={2} opacity={at(t0, 0.3) - at(t0 + dur, 0.4)} />
      ) : null}
      {series.map((s, si) => (
        <g key={si}>
          <polyline
            clipPath={`url(#${id})`}
            points={xs.map((x, i) => `${x},${s.ys[i]}`).join(" ")}
            fill="none"
            stroke={s.color}
            strokeWidth={7}
            strokeLinejoin="round"
            strokeDasharray={s.dash ? "30 16" : undefined}
          />
          {xs.map((x, i) => (
            <g key={i} transform={`translate(${x} ${s.ys[i]}) scale(${at(pointT(i), 0.4, POP)})`}>
              <Marker kind={s.kind} color={s.color} />
            </g>
          ))}
          {s.offsets?.map(([dx, dy], i) => (
            <text key={i} x={xs[i] + dx} y={s.ys[i] + dy + 12} fontSize={34} textAnchor="middle" fill={s.ink} style={halo} opacity={at(pointT(i) + 0.05, 0.3)}>
              {s.values[i]}
            </text>
          ))}
          {s.offsets ? null : (
            // Shows the last measured point, never a value interpolated between points.
            <text x={sweepX + 26} y={Math.min(interpolate(sweepX, xs, s.ys) + 13, 856)} fontSize={36} fontWeight={700} fill={s.ink} style={halo} opacity={at(t0, 0.3)}>
              {s.values[Math.max(reached, 0)]}
            </text>
          )}
        </g>
      ))}
    </g>
  );
};

const Bar: React.FC<{ x: number; w: number; base: number; h: number; value: number; color: string; start: number }> = ({ x, w, base, h, value, color, start }) => {
  const { at } = useClock();
  const p = at(start, 0.9);
  return (
    <g>
      <rect x={x} y={base - h * p} width={w} height={h * p} fill={color} stroke="#111" strokeWidth={3} opacity={at(start, 0.1)} />
      <text x={x + w / 2} y={base - h * p - 16} fontSize={36} textAnchor="middle" opacity={at(start, 0.25)}>
        {(value * p).toFixed(3)}
      </text>
    </g>
  );
};

const CYAN = "#abe0fa";
const PERIWINKLE = "#bfbfff";
const VIOLET = "#d9b3d9";
const GREEN = "#b3ffb3";
const LINE_BLUE = "#5b9bd5";
const LINE_ORANGE = "#f0a05a";
const INK_BLUE = "#2f6fb0";
const INK_ORANGE = "#c0681f";
const fmt3 = (v: number) => v.toFixed(3);

export const F1ByRho: React.FC = () => {
  const box = { l: 190, t: 230, r: 1760, b: 880 };
  const rho = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
  const xOf = (v: number) => box.l + (v - 0.05) * (box.r - box.l);
  const yOf = (v: number) => box.b - ((box.b - box.t) * v) / 0.72;
  const data: { name: string; color: string; kind: Kind; v: number[] }[] = [
    { name: "GPT-5.5", color: "#0072b2", kind: "circle", v: [0.42, 0.521, 0.579, 0.596, 0.621, 0.641, 0.624, 0.628, 0.625, 0.612] },
    { name: "Qwen 3.5 27B", color: "#009e73", kind: "square", v: [0.457, 0.476, 0.522, 0.559, 0.523, 0.512, 0.524, 0.519, 0.484, 0.474] },
    { name: "Gemma 4 12B", color: "#d55e00", kind: "triangle", v: [0.378, 0.384, 0.356, 0.353, 0.321, 0.252, 0.231, 0.209, 0.21, 0.206] },
    { name: "Qwen 3.5 4B", color: "#cc79a7", kind: "diamond", v: [0.216, 0.226, 0.185, 0.16, 0.12, 0.068, 0.048, 0.033, 0.017, 0.018] },
  ];
  return (
    <Figure
      title="Mean F1 by corruption rate"
      subtitle={<>Four strongest curators, <Var>n</Var> = 30 episodes per cell</>}
      legend={data.map((d) => ({ swatch: <LineSwatch kind={d.kind} color={d.color} />, label: d.name }))}
    >
      <Axes
        box={box}
        x={rho.map((v) => ({ at: xOf(v), label: v === 1 ? "1" : v }))}
        y={[0, 0.2, 0.4, 0.6].map((v) => ({ at: yOf(v), label: v === 0 ? "0" : v }))}
        xTitle={<>Corruption rate <Var>ρ</Var></>}
        yTitle="Mean F1"
      />
      <Lines
        id="f1"
        box={box}
        xs={rho.map(xOf)}
        t0={0.9}
        dur={5.2}
        series={data.map((d) => ({ color: d.color, ink: d.color, kind: d.kind, ys: d.v.map(yOf), values: d.v.map(fmt3) }))}
      />
    </Figure>
  );
};

export const EndedRate: React.FC = () => {
  const box = { l: 190, t: 190, r: 1860, b: 880 };
  const bars = [
    { a: "Gemma 4", b: "12B", v: 0.197, c: CYAN },
    { a: "Llama 3.2", b: "3B", v: 0, c: PERIWINKLE },
    { a: "Llama 3.1", b: "8B", v: 0, c: PERIWINKLE },
    { a: "Llama 3.2", b: "1B", v: 0.243, c: PERIWINKLE },
    { a: "OpenAI", b: "GPT 5.5", v: 0.965, c: VIOLET },
    { a: "Qwen 3.5", b: "4B", v: 0.157, c: GREEN },
    { a: "Qwen 3.5", b: "9B", v: 0.207, c: GREEN },
    { a: "Qwen 3.5", b: "2B", v: 0.403, c: GREEN },
    { a: "Qwen 3.5", b: "27B", v: 0.743, c: GREEN },
  ];
  const slot = (box.r - box.l) / bars.length;
  const center = (i: number) => box.l + slot * (i + 0.5);
  const plotH = (v: number) => ((box.b - box.t) * v) / 1.1;
  return (
    <Figure title="Runs ended with the END action" subtitle="Ended rate by model family">
      <Axes
        box={box}
        x={bars.map((d, i) => ({
          at: center(i),
          label: <><tspan x={center(i)} fontSize={34}>{d.a}</tspan><tspan x={center(i)} dy={42} fontSize={34}>{d.b}</tspan></>,
        }))}
        y={[0, 0.5, 1].map((v) => ({ at: box.b - plotH(v), label: v.toFixed(1) }))}
        yTitle="% of Runs Ended"
      />
      {bars.map((d, i) => (
        <Bar key={i} x={center(i) - slot * 0.31} w={slot * 0.62} base={box.b} h={plotH(d.v)} value={d.v} color={d.c} start={0.8 + i * 0.28} />
      ))}
    </Figure>
  );
};

export const RelationQuality: React.FC = () => {
  const box = { l: 190, t: 230, r: 1860, b: 850 };
  const groups: { a: string; b?: string; v: [number, number, number] }[] = [
    { a: "SUBSUMPTION", v: [0.667, 0.857, 0.75] },
    { a: "SEMANTIC-", b: "PRESERVING", v: [0.037, 0.4, 0.067] },
    { a: "COMPLEMENTARY", v: [0, 0, 0] },
    { a: "DISTINCT", v: [0.988, 0.605, 0.75] },
  ];
  const colors = [CYAN, PERIWINKLE, VIOLET];
  const slot = (box.r - box.l) / groups.length;
  const center = (i: number) => box.l + slot * (i + 0.5);
  const plotH = (v: number) => ((box.b - box.t) * v) / 1.05;
  const W = 116;
  return (
    <Figure
      title="Per-relation quality of the verifier"
      subtitle={<>Output-grounded verifier on <Var>G</Var><tspan fontSize={26} dy={8}>0</tspan><tspan dy={-8}> (one-vs-rest)</tspan></>}
      legend={["Precision (P)", "Recall (R)", "F1-score"].map((label, i) => ({ swatch: <BarSwatch color={colors[i]} />, label }))}
    >
      <Axes
        box={box}
        x={groups.map((g, i) => ({
          at: center(i),
          label: <><tspan x={center(i)} fontSize={34}>{g.a}</tspan>{g.b ? <tspan x={center(i)} dy={42} fontSize={34}>{g.b}</tspan> : null}</>,
        }))}
        y={[0, 0.2, 0.4, 0.6, 0.8, 1].map((v) => ({ at: box.b - plotH(v), label: v.toFixed(1) }))}
        xTitle="Relation"
        xTitleY={1010}
        yTitle="Score"
      />
      {groups.map((g, gi) =>
        g.v.map((v, bi) => (
          <Bar key={`${gi}-${bi}`} x={center(gi) - W * 1.5 + W * bi} w={W} base={box.b} h={plotH(v)} value={v} color={colors[bi]} start={0.9 + gi * 1.0 + bi * 0.18} />
        )),
      )}
    </Figure>
  );
};

export const ScreeningTradeoff: React.FC = () => {
  const box = { l: 210, t: 190, r: 1700, b: 880 };
  const ks = [1, 3, 5, 10, 20, 50];
  const xs = ks.map((_, i) => box.l + ((i + 0.5) * (box.r - box.l)) / ks.length);
  const yL = (v: number) => box.b - ((box.b - box.t) * (v - 0.75)) / 0.3138;
  const yR = (v: number) => box.b - ((box.b - box.t) * (v - 90)) / 13.36;
  const recall = [0.788, 0.913, 0.963, 1, 1, 1];
  const discarded = [99.3, 98.0, 97.1, 95.1, 92.9, 92.3];
  const { at } = useClock();
  const T = 0.9 + 4.5;
  const lineP = at(T, 0.6);
  return (
    <Figure title="Screening trade-off" subtitle={<>Across neighbor count <Var>k</Var>, radius 0.05</>}>
      <Axes
        box={box}
        x={ks.map((k, i) => ({ at: xs[i], label: k }))}
        y={[0.75, 0.8, 0.85, 0.9, 0.95, 1, 1.05].map((v) => ({ at: yL(v), label: v.toFixed(2) }))}
        yColor={INK_BLUE}
        right={{ ticks: [90, 92, 94, 96, 98, 100].map((v) => ({ at: yR(v), label: v })), title: "pairs discarded (%)", color: INK_ORANGE }}
        xTitle={<>neighbors <Var>k</Var></>}
        yTitle="merge recall"
      />
      <line x1={xs[3]} x2={xs[3]} y1={box.t} y2={box.t + (box.b - box.t) * lineP} stroke="#999" strokeWidth={4} strokeDasharray="4 10" strokeLinecap="round" opacity={at(T, 0.1)} />
      <Lines
        id="screen"
        xs={xs}
        t0={0.9}
        dur={4.5}
        series={[
          { color: LINE_BLUE, ink: INK_BLUE, kind: "circle", ys: recall.map(yL), values: recall.map(fmt3), offsets: [[58, 40], [62, 42], [-44, -48], [0, -50], [0, -50], [0, -50]] },
          { color: LINE_ORANGE, ink: INK_ORANGE, kind: "square", dash: true, ys: discarded.map(yR), values: discarded.map((v) => `${v.toFixed(1)}%`), offsets: [[40, -50], [46, -48], [150, -12], [52, -48], [38, -48], [8, -48]] },
        ]}
      />
      <text x={xs[3]} y={box.t + 12} fontSize={38} fontWeight={700} textAnchor="middle" fill={ACCENT} style={halo} opacity={at(T + 0.4, 0.5)}>
        <Var>k</Var> = 10: full recall with 95.1% of pairs discarded
      </text>
    </Figure>
  );
};

export const CandidateGrowth: React.FC = () => {
  const box = { l: 210, t: 230, r: 1700, b: 880 };
  const ns = [10, 20, 30, 40, 50, 60, 80, 100];
  const xs = ns.map((n) => box.l + ((n - 5) * (box.r - box.l)) / 100);
  const yL = (v: number) => box.b - ((box.b - box.t) * v) / 561;
  const yR = (v: number) => box.b - ((box.b - box.t) * v) / 100;
  const size = [30, 73, 112, 152, 200, 240, 329, 405];
  const share = [66.7, 38.4, 25.7, 19.5, 16.3, 13.6, 10.4, 8.2];
  const { at } = useClock();
  const T = 0.9 + 4.8;
  return (
    <Figure
      title="Candidate-set growth"
      subtitle={<>Nested random subsamples of <Var>L</Var><tspan fontSize={26} dy={8}>0</tspan></>}
      legend={[
        { swatch: <LineSwatch kind="circle" color={LINE_BLUE} />, label: <>Candidate-set size |<i>C</i>|</> },
        { swatch: <LineSwatch kind="square" color={LINE_ORANGE} dash />, label: "Share of all pairs (%)" },
      ]}
    >
      <Axes
        box={box}
        x={ns.map((n, i) => ({ at: xs[i], label: n }))}
        y={[0, 100, 200, 300, 400, 500].map((v) => ({ at: yL(v), label: v }))}
        yColor={INK_BLUE}
        right={{ ticks: [0, 20, 40, 60, 80, 100].map((v) => ({ at: yR(v), label: v })), title: "Share of all pairs (%)", color: INK_ORANGE }}
        xTitle={<>Subsample size <Var>n</Var></>}
        yTitle={<>Candidate-set size |<Var>C</Var>|</>}
      />
      <Lines
        id="growth"
        xs={xs}
        t0={0.9}
        dur={4.8}
        series={[
          { color: LINE_BLUE, ink: INK_BLUE, kind: "circle", ys: size.map(yL), values: size.map(String), offsets: [[0, -50], [0, -50], [-56, 62], [0, -50], [0, -50], [0, -50], [0, -50], [0, -50]] },
          { color: LINE_ORANGE, ink: INK_ORANGE, kind: "square", dash: true, ys: share.map(yR), values: share.map((v) => `${v.toFixed(1)}%`), offsets: [[0, -50], [38, -50], [70, 62], [0, 60], [0, -50], [0, -50], [0, -52], [0, -50]] },
        ]}
      />
      <g opacity={at(T, 0.5)} textAnchor="end" fontSize={38}>
        <rect x={1290} y={222} width={400} height={108} rx={14} fill="#fff" stroke="#999" strokeWidth={3} />
        <text x={1668} y={266}>|<Var>C</Var>| = 2.38 <Var>n</Var><tspan fontSize={26} dy={-14}>1.13</tspan></text>
        <text x={1668} y={314}><Var>R</Var><tspan fontSize={26} dy={-14}>2</tspan><tspan dy={14}> = 0.998</tspan></text>
      </g>
    </Figure>
  );
};

const LogPanel: React.FC<{
  box: Box;
  min: number;
  max: number;
  exps: number[];
  color: string;
  title: string;
  yTitleX: number;
  values: { v: number; text: string }[];
  start: number;
}> = ({ box, min, max, exps, color, title, yTitleX, values, start }) => {
  const { at } = useClock();
  const xOf = (v: number) => box.l + ((Math.log10(v) - Math.log10(min)) * (box.r - box.l)) / (Math.log10(max) - Math.log10(min));
  const names = ["100", "1,000", "10,000"];
  const slot = (box.b - box.t) / names.length;
  const yOf = (i: number) => box.t + slot * (i + 0.5);
  const H = 96;
  return (
    <g>
      <text x={(box.l + box.r) / 2} y={box.t - 22} fontSize={42} fontWeight={700} textAnchor="middle" opacity={at(start - 0.4, 0.4)}>{title}</text>
      <Axes
        box={box}
        gridX
        x={exps.map((e) => ({
          at: xOf(10 ** e),
          label: <>10<tspan fontSize={26} dy={-16}>{e < 0 ? `−${-e}` : e}</tspan></>,
        }))}
        y={names.map((name, i) => ({ at: yOf(i), label: name }))}
        xTitle="cache footprint (GB, log scale)"
        xTitleY={925}
        yTitle="library size (skills)"
        yTitleX={yTitleX}
      />
      {values.map((d, i) => {
        const p = at(start + i * 0.32, 1);
        const w = (xOf(d.v) - box.l) * p;
        return (
          <g key={i}>
            <rect x={box.l} y={yOf(i) - H / 2} width={w} height={H} fill={color} stroke="#111" strokeWidth={3} opacity={at(start + i * 0.32, 0.1)} />
            <text x={box.l + w + 14} y={yOf(i) + 13} fontSize={38} fontWeight={700} opacity={at(start + i * 0.32 + 0.5, 0.4)}>{d.text}</text>
          </g>
        );
      })}
    </g>
  );
};

export const CacheFootprint: React.FC = () => {
  const { at } = useClock();
  const T = 4.6;
  return (
    <Figure title="Cache footprint by library size" subtitle="Raw output sets vs. backend features only">
      <LogPanel
        box={{ l: 260, t: 250, r: 860, b: 800 }}
        min={0.03}
        max={4083}
        exps={[-1, 0, 1, 2, 3]}
        color={PERIWINKLE}
        title="(a) Raw output cache"
        yTitleX={70}
        start={0.9}
        values={[{ v: 21.5, text: "21.5 GB" }, { v: 214.8, text: "214.8 GB" }, { v: 2148, text: "2.1 TB" }]}
      />
      <LogPanel
        box={{ l: 1190, t: 250, r: 1790, b: 800 }}
        min={0.03}
        max={12}
        exps={[-1, 0, 1]}
        color={GREEN}
        title="(b) Features-only cache"
        yTitleX={1015}
        start={2.7}
        values={[{ v: 0.05, text: "0.05 GB" }, { v: 0.54, text: "0.54 GB" }, { v: 5.4, text: "5.4 GB" }]}
      />
      <g opacity={at(T, 0.3)} transform={`translate(960 995) scale(${at(T, 0.5, POP)})`}>
        <rect x={-300} y={-40} width={600} height={80} rx={40} fill={ACCENT} />
        <text y={15} fontSize={44} fontWeight={700} textAnchor="middle" fill="#fff">
          395× saving at 10<tspan fontSize={28} dy={-16}>4</tspan><tspan dy={16}> skills</tspan>
        </text>
      </g>
    </Figure>
  );
};
