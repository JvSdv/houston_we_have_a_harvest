import { buildViewData } from "@/lib/view-data";
import { GroundTruthApp } from "@/components/gt/GroundTruthApp";

// Página estática: os riscos são calculados em tempo de build a partir dos
// dados diários reais da NASA POWER (src/data/power_daily_*.json).
export default function Home() {
  const data = buildViewData();
  return <GroundTruthApp data={data} />;
}
