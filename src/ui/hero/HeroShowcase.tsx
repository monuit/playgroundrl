"use client";

import dynamic from "next/dynamic";

const HeroPlayground = dynamic(() => import("@/ui/hero/HeroPlayground"), {
  ssr: false,
});

export function HeroShowcase() {
  return (
    <div className="h-[420px] w-full">
      <HeroPlayground />
    </div>
  );
}

export default HeroShowcase;
