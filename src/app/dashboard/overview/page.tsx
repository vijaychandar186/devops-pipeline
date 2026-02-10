import OverViewPage from '@/features/overview/components/overview';

export default async function Overview() {
  // Simulate async data fetching - replace with real API calls in production
  await new Promise((resolve) => setTimeout(resolve, 800));

  return <OverViewPage />;
}
