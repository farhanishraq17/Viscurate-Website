import { Composition } from "remotion";
import { Explainer } from "./Explainer";
import {
  CacheFootprint,
  CandidateGrowth,
  EndedRate,
  F1ByRho,
  RelationQuality,
  ScreeningTradeoff,
} from "./Figures";

// Composition ids match the file names in static/videos/ and static/images/.
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="explainer" component={Explainer} durationInFrames={540} fps={30} width={1920} height={1080} />
      <Composition id="f1-by-rho" component={F1ByRho} durationInFrames={255} fps={30} width={1920} height={1080} />
      <Composition id="ended-rate" component={EndedRate} durationInFrames={180} fps={30} width={1920} height={1080} />
      <Composition id="relation-quality" component={RelationQuality} durationInFrames={210} fps={30} width={1920} height={1080} />
      <Composition id="screening-tradeoff" component={ScreeningTradeoff} durationInFrames={255} fps={30} width={1920} height={1080} />
      <Composition id="candidate-growth" component={CandidateGrowth} durationInFrames={255} fps={30} width={1920} height={1080} />
      <Composition id="cache-footprint" component={CacheFootprint} durationInFrames={225} fps={30} width={1920} height={1080} />
    </>
  );
};
