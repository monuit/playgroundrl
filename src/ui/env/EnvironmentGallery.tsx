"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ENVIRONMENTS } from "@/env";
import type { ActionSpace, EnvObservation } from "@/env/types";
import { EnvCanvas } from "./EnvCanvas";

interface GalleryEntry {
  id: string;
  name: string;
  description: string;
  observationShape: string;
  actionSummary: string;
  telemetryFields: string[];
}

const stringifyObservationShape = (shape: readonly number[]): string => {
  if (!shape.length) {
    return "Scalar";
  }
  return shape.join(" × ");
};

const stringifyActionSpace = (actionSpace: ActionSpace): string => {
  if (actionSpace.type === "discrete") {
    return `${actionSpace.n} discrete actions`;
  }
  const shapeLabel = actionSpace.shape?.length
    ? actionSpace.shape.join(" × ")
    : "1";
  return `Box[${shapeLabel}] • range ${actionSpace.low.toFixed(2)} → ${actionSpace.high.toFixed(2)}`;
};

const extractTelemetryKeys = (observation: EnvObservation | undefined): string[] => {
  if (!observation || typeof observation !== "object") {
    return [];
  }
  if (!("metadata" in observation)) {
    return [];
  }
  const metadata = observation.metadata;
  if (!metadata || typeof metadata !== "object") {
    return [];
  }
  return Object.keys(metadata).slice(0, 6);
};

export const GALLERY_ENTRIES: GalleryEntry[] = ENVIRONMENTS.map((definition) => {
  try {
    const instance = definition.create();
    const observation = instance.reset();
    return {
      id: definition.id,
      name: definition.name,
      description: definition.description,
      observationShape: stringifyObservationShape(instance.obsSpace.shape),
      actionSummary: stringifyActionSpace(instance.actionSpace),
      telemetryFields: extractTelemetryKeys(observation),
    };
  } catch (error) {
    console.warn(`Failed to build gallery entry for ${definition.id}`, error);
    return {
      id: definition.id,
      name: definition.name,
      description: definition.description,
      observationShape: "Unknown",
      actionSummary: "Unknown",
      telemetryFields: [],
    };
  }
});

export function EnvironmentGallery() {
  const [activeEnv, setActiveEnv] = useState<string>(GALLERY_ENTRIES[0]?.id ?? "");

  const selected = useMemo(() => {
    return GALLERY_ENTRIES.find((entry) => entry.id === activeEnv) ?? GALLERY_ENTRIES[0];
  }, [activeEnv]);

  if (!selected) {
    return null;
  }

  const telemetry = selected.telemetryFields.length ? selected.telemetryFields : ["No telemetry metadata exposed"];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <Card className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/75 backdrop-blur">
        <CardHeader className="space-y-4">
          <div>
            <Badge className="rounded-full border border-cyan-400/40 bg-cyan-500/15 px-3 py-1 text-[0.6rem] uppercase tracking-[0.35em] text-cyan-200">
              Environment gallery
            </Badge>
            <CardTitle className="mt-4 text-2xl font-semibold text-white">{selected.name}</CardTitle>
          </div>
          <p className="text-sm text-slate-300">{selected.description}</p>
          <div className="max-w-xs">
            <Select value={selected.id} onValueChange={setActiveEnv}>
              <SelectTrigger className="border-white/15 bg-white/10 text-left text-white">
                <SelectValue placeholder="Choose environment" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-slate-950/95 text-slate-100">
                {GALLERY_ENTRIES.map((entry) => (
                  <SelectItem key={entry.id} value={entry.id}>
                    {entry.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_20px_80px_-60px_rgba(56,189,248,0.65)]">
              <dt className="text-xs uppercase tracking-[0.35em] text-slate-400">Observation space</dt>
              <dd className="mt-2 text-lg font-semibold text-white">{selected.observationShape}</dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_20px_80px_-60px_rgba(129,140,248,0.6)]">
              <dt className="text-xs uppercase tracking-[0.35em] text-slate-400">Action space</dt>
              <dd className="mt-2 text-lg font-semibold text-white">{selected.actionSummary}</dd>
            </div>
          </dl>
          <section className="space-y-2">
            <h3 className="text-xs uppercase tracking-[0.35em] text-slate-400">Telemetry fields</h3>
            <div className="flex flex-wrap gap-2">
              {telemetry.map((field) => (
                <span
                  key={field}
                  className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[0.65rem] uppercase tracking-[0.35em] text-slate-200"
                >
                  {field}
                </span>
              ))}
            </div>
          </section>
        </CardContent>
      </Card>
      <div className="flex items-stretch">
        <div className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-3 shadow-[0_20px_80px_-60px_rgba(56,189,248,0.6)]">
          <EnvCanvas envId={selected.id} />
        </div>
      </div>
    </div>
  );
}

export default EnvironmentGallery;
