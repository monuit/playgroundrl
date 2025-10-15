"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Github, Info, Play } from "lucide-react";
import { animated, useSpring, config as webConfig } from "@react-spring/web";
import { SimulationCanvas } from "@/ui/simulation/SimulationCanvas";
import { SimulationControls } from "@/ui/simulation/SimulationControls";
import { SimulationMetrics } from "@/ui/simulation/SimulationMetrics";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useSimulationStore } from "@/state/simulationStore";
import { useShallow } from "zustand/react/shallow";

export default function Page() {
  const [isMounted, setIsMounted] = useState(false);

  const { status, start, loadPolicy } = useSimulationStore(
    useShallow((state) => ({
      status: state.status,
      start: state.start,
      loadPolicy: state.loadPolicy,
    }))
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    void loadPolicy();
  }, [loadPolicy]);

  const initialAnimation = useSpring({
    opacity: status === "ready" ? 1 : 0,
    transform: status === "ready" ? "translateY(0)" : "translateY(100%)",
    config: webConfig.wobbly,
  });

  const runningAnimation = useSpring({
    opacity: status === "running" ? 1 : 0,
    transform: status === "running" ? "translateY(0)" : "translateY(-100%)",
    config: webConfig.wobbly,
  });

  const loadingAnimation = useSpring({
    opacity: status === "loading" ? 1 : 0,
    transform: status === "loading" ? "translateY(0)" : "translateY(-100%)",
    config: webConfig.default,
  });

  if (!isMounted) {
    return null;
  }

  return (
    <main className="relative size-full overflow-hidden bg-slate-950 text-slate-100">
      <div className="fixed inset-0 size-full">
        <SimulationCanvas />
      </div>

      {status === "loading" && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950">
          <p className="flex items-center gap-2 text-slate-300">Loading policy network...</p>
        </div>
      )}

      <animated.div
        style={loadingAnimation}
        className="absolute top-16 z-10 flex w-full flex-col items-center gap-4 text-center"
      >
        <p className="text-slate-300">Loading ONNX policy...</p>
      </animated.div>

      <animated.div
        style={initialAnimation}
        className="absolute top-16 z-10 flex w-full flex-col items-center gap-4 text-center"
      >
        {status === "ready" && (
          <>
            <h1 className="text-4xl font-bold italic">PPO Bunny</h1>
            <div className="flex flex-row gap-2">
              <Button className="flex flex-row gap-2" onClick={() => void start()} size="lg">
                Run <Play className="size-4" />
              </Button>
              <Dialog>
                <DialogTrigger>
                  <Button size="lg" className="flex flex-row gap-2" variant="outline">
                    Info <Info className="size-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[70%] max-w-[90%] overflow-y-auto bg-card text-sm sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>INFO</DialogTitle>
                    <DialogDescription className="text-primary/70">
                      PlaygroundRL is an ONNX inference playground where agents navigate a neon grid world to maximize reward in
                      your browser—no backend, no GPU.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <h3 className="font-semibold">How does it work?</h3>
                    <p className="text-sm text-slate-300">
                      Pre-trained policies (ONNX format) stream decisions to a WebWorker that ticks the grid at 60 Hz. React
                      Three Fiber renders the agents, and all computation happens client-side using WebGL + WebAssembly.
                    </p>
                    <h3 className="font-semibold">Controls</h3>
                    <ul className="ml-6 list-disc space-y-1 text-sm text-slate-300">
                      <li>Drag to rotate the camera around the grid</li>
                      <li>Scroll to zoom in/out</li>
                      <li>Use the side panels to adjust difficulty, agent count, and speed</li>
                      <li>Upload your own ONNX policy or load the default from /models</li>
                    </ul>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </>
        )}
      </animated.div>

      <animated.div
        style={runningAnimation}
        className="absolute top-16 z-10 flex w-full flex-col items-center gap-4 text-center"
      >
        {status === "running" && (
          <>
            <h1 className="text-4xl font-bold italic">Agents in motion</h1>
            <p className="text-sm text-slate-400">Watch the policy stream actions into the grid</p>
          </>
        )}
      </animated.div>

      <div className="pointer-events-none absolute bottom-16 z-10 flex w-full flex-col items-center justify-center gap-4">
        <div className="pointer-events-auto flex items-center gap-6">
          <div className="max-w-sm rounded-2xl border border-white/10 bg-slate-950/80 p-4 backdrop-blur">
            <SimulationControls />
          </div>
          <div className="max-w-sm rounded-2xl border border-white/10 bg-slate-950/80 p-4 backdrop-blur">
            <SimulationMetrics />
          </div>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="text-slate-300 hover:text-white">
            <Link href="/docs">Docs</Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 text-slate-300 hover:text-white"
          >
            <Link href="https://github.com/boredbedouin/PlaygroundRL" target="_blank" rel="noreferrer">
              <Github className="size-4" />
              GitHub
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
