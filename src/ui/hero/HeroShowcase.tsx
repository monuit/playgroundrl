"use client";

import dynamic from "next/dynamic";

import { cn } from "@/lib/utils";

const HeroPlayground = dynamic(() => import("@/ui/hero/HeroPlayground"), {
  ssr: false,
});

interface HeroShowcaseProps {
  className?: string;
}

export function HeroShowcase({ className }: HeroShowcaseProps) {
  return (
    <div className={cn("h-[420px] w-full", className)}>
      <HeroPlayground />
    </div>
  );
}

export default HeroShowcase;
