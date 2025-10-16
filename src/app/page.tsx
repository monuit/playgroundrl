'use client';

import dynamic from 'next/dynamic';
import { BunnyHero } from '@/ui/hero/BunnyHero';

const TrainingDashboard = dynamic(() => import('@/ui/dashboard/TrainingDashboard'), {
  ssr: false,
});

export default function Page() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-950">
      <BunnyHero />
      <section id="training" className="relative">
        <TrainingDashboard />
      </section>
    </div>
  );
}
