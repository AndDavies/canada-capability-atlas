import { AtlasDashboard } from "@/components/atlas-dashboard";
import { getAtlasData, getSources } from "@/data/loaders";

export default async function Home() {
  const [data, sources] = await Promise.all([getAtlasData(), getSources()]);
  return <AtlasDashboard data={data} sources={sources} />;
}
