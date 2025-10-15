"use client";

import { useEffect, useRef } from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import type { TrainingMetric } from "@/state/trainingStore";

interface MetricsChartProps {
  metrics: TrainingMetric[];
}

export function MetricsChart({ metrics }: MetricsChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<uPlot | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }
    if (!chartRef.current) {
      chartRef.current = new uPlot(
        {
          width: containerRef.current.clientWidth,
          height: 220,
          cursor: { show: false },
          legend: { show: false },
          axes: [
            {
              stroke: "#64748b",
              grid: { show: false },
            },
            {
              stroke: "#64748b",
              grid: { stroke: "#e2e8f0", width: 1 },
            },
          ],
          series: [
            {},
            {
              label: "Reward",
              stroke: "#2563eb",
              width: 2,
            },
            {
              label: "Loss",
              stroke: "#e11d48",
              width: 1,
            },
            {
              label: "Entropy",
              stroke: "#10b981",
              width: 1,
            },
            {
              label: "Steps / Sec",
              stroke: "#f97316",
              width: 1,
            },
          ],
        },
        metricsToSeries(metrics),
        containerRef.current
      );
    } else {
      chartRef.current.setData(metricsToSeries(metrics));
    }

    const handleResize = () => {
      if (!chartRef.current || !containerRef.current) {
        return;
      }
      chartRef.current.setSize({
        width: containerRef.current.clientWidth,
        height: 220,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [metrics]);

  useEffect(
    () => () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    },
    []
  );

  return <div className="h-56 w-full" ref={containerRef} />;
}

function metricsToSeries(metrics: TrainingMetric[]): uPlot.AlignedData {
  if (!metrics.length) {
    return [
      new Float64Array(0),
      new Float64Array(0),
      new Float64Array(0),
      new Float64Array(0),
      new Float64Array(0),
    ];
  }
  const episodes = new Float64Array(metrics.length);
  const rewards = new Float64Array(metrics.length);
  const losses = new Float64Array(metrics.length);
  const entropies = new Float64Array(metrics.length);
  const stepsPerSec = new Float64Array(metrics.length);
  metrics.forEach((metric, idx) => {
    episodes[idx] = metric.episode;
    rewards[idx] = metric.reward;
    losses[idx] = Number.isFinite(metric.loss ?? NaN) ? metric.loss! : NaN;
    entropies[idx] = Number.isFinite(metric.entropy ?? NaN) ? metric.entropy! : NaN;
    stepsPerSec[idx] = Number.isFinite(metric.stepsPerSecond ?? NaN)
      ? metric.stepsPerSecond!
      : NaN;
  });
  return [episodes, rewards, losses, entropies, stepsPerSec];
}
