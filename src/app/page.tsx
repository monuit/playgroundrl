'use client';

import dynamic from 'next/dynamic';

const TrainingDashboard = dynamic(() => import('@/ui/dashboard/TrainingDashboard'), {
  ssr: false,
});

export default function Page() {
  return <TrainingDashboard />;
}
