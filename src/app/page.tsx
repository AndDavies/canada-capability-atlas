import { AtlasDashboard } from "@/components/atlas-dashboard";
import { getAtlasData, getSources } from "@/data/loaders";

export default function Home() {
  return <AtlasDashboard data={getAtlasData()} sources={getSources()} />;
}
