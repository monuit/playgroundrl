"use client";

import { Fragment, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTrainingStore } from "@/state/trainingStore";

export function CheckpointPanel() {
  const {
    checkpoints,
    saveCheckpoint,
    loadCheckpoint,
    deleteCheckpoint,
    renameCheckpoint,
    setCheckpointNotes,
    toggleCheckpointPin,
    exportCheckpoint,
    status,
  } = useTrainingStore();
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const handleSave = async () => {
    if (saving) {
      return;
    }
    try {
      setSaving(true);
      await saveCheckpoint(label.trim() || undefined);
      setLabel("");
    } finally {
      setSaving(false);
    }
  };

  const handleLoad = async (id: number) => {
    try {
      setLoadingId(id);
      await loadCheckpoint(id);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Card className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 shadow-[0_20px_80px_-48px_rgba(56,189,248,0.75)] backdrop-blur-xl">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),transparent_65%)]"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(150deg,rgba(129,140,248,0.18),transparent_70%)]" aria-hidden />
      <CardHeader className="relative gap-3 space-y-0 border-b border-white/10 bg-white/5 px-6 py-6 sm:flex sm:flex-wrap sm:items-end sm:justify-between">
        <div className="space-y-2">
          <CardTitle className="text-2xl font-semibold text-white">Checkpoints</CardTitle>
          <CardDescription className="text-slate-300">
            Snapshot the current policy weights and restore them later.
          </CardDescription>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Input
            type="text"
            placeholder="Label (optional)"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            className="sm:w-44 border-white/20 bg-white/10 text-white placeholder:text-slate-400 focus-visible:ring-cyan-400/60"
          />
          <Button
            variant="outline"
            size="sm"
            className="border-emerald-400/40 bg-emerald-500/15 text-emerald-100 hover:border-emerald-300/60 hover:text-white disabled:opacity-60"
            onClick={() => void handleSave()}
            disabled={saving || status === "initialising"}
          >
            {saving ? "Saving..." : "Save checkpoint"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-4 px-6 py-6">
        {checkpoints.length === 0 ? (
          <p className="text-sm text-slate-300">
            No checkpoints yet. Save one while the agent is running.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <table className="w-full table-fixed text-left text-xs text-slate-300">
              <thead className="bg-white/10 uppercase tracking-[0.3em] text-slate-400">
                <tr>
                  <th className="px-3 py-2">Episode</th>
                  <th className="px-3 py-2">Reward</th>
                  <th className="px-3 py-2">Steps</th>
                  <th className="px-3 py-2">Pinned / Label</th>
                  <th className="px-3 py-2">Updated</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {checkpoints.map((checkpoint) => (
                  <Fragment key={checkpoint.id}>
                    <tr className="bg-white/5 text-slate-200">
                      <td className="px-3 py-2 font-mono text-slate-400">
                        {checkpoint.episode}
                      </td>
                      <td className="px-3 py-2 text-emerald-300">
                        {checkpoint.reward.toFixed(2)}
                      </td>
                      <td className="px-3 py-2">{checkpoint.steps}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {checkpoint.pinned ? (
                            <Badge
                              variant="secondary"
                              className="border border-amber-400/50 bg-amber-500/15 text-amber-100"
                            >
                              * Pinned
                            </Badge>
                          ) : null}
                          {checkpoint.label ? (
                            <Badge variant="outline" className="border-white/20 bg-white/5 font-mono text-[0.7rem] text-white">
                              {checkpoint.label}
                            </Badge>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-slate-400">
                        {new Date(checkpoint.updatedAt ?? checkpoint.createdAt).toLocaleString()}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-sky-400/40 bg-sky-500/15 text-sky-100 hover:border-sky-300/60 hover:text-white disabled:opacity-60"
                            onClick={() => void handleLoad(checkpoint.id)}
                            disabled={loadingId === checkpoint.id}
                          >
                            {loadingId === checkpoint.id ? "Loading…" : "Load"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-amber-400/40 bg-amber-500/15 text-amber-100 hover:border-amber-300/60 hover:text-white disabled:opacity-60"
                            onClick={() => void toggleCheckpointPin(checkpoint.id)}
                          >
                            {checkpoint.pinned ? "Unpin" : "Pin"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-indigo-400/40 bg-indigo-500/15 text-indigo-100 hover:border-indigo-300/60 hover:text-white disabled:opacity-60"
                            onClick={() => {
                              const next = window.prompt("Checkpoint label", checkpoint.label ?? "");
                              if (next !== null) {
                                void renameCheckpoint(checkpoint.id, next.trim());
                              }
                            }}
                          >
                            Rename
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-cyan-400/40 bg-cyan-500/15 text-cyan-100 hover:border-cyan-300/60 hover:text-white disabled:opacity-60"
                            onClick={() => {
                              const next = window.prompt("Add checkpoint notes", checkpoint.notes ?? "");
                              if (next !== null) {
                                void setCheckpointNotes(checkpoint.id, next.trim());
                              }
                            }}
                          >
                            Notes
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-emerald-400/40 bg-emerald-500/15 text-emerald-100 hover:border-emerald-300/60 hover:text-white disabled:opacity-60"
                            onClick={async () => {
                              const blob = await exportCheckpoint(checkpoint.id);
                              if (!blob) {
                                return;
                              }
                              const url = URL.createObjectURL(blob);
                              const anchor = document.createElement("a");
                              anchor.href = url;
                              anchor.download = `${checkpoint.label ?? "checkpoint"}-${checkpoint.id}.bin`;
                              anchor.click();
                              URL.revokeObjectURL(url);
                            }}
                          >
                            Export
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-rose-400/50 bg-rose-500/20 text-rose-100 hover:border-rose-300/60 hover:text-white disabled:opacity-60"
                            onClick={() => void deleteCheckpoint(checkpoint.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {checkpoint.notes ? (
                      <tr className="bg-white/5">
                        <td colSpan={6} className="px-3 py-2 text-[0.7rem] text-slate-200">
                          Notes: {checkpoint.notes}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}






























