import OverViewPage from '@/features/overview/Overview';
import { fetchLLMData } from '@/features/overview/actions/fetch-llm-data';

export default async function Overview() {
  const data = await fetchLLMData();
  return <OverViewPage data={data} />;
}
