'use client';

import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { LevelType } from '@/types/game';
import { LevelType as LevelEnum } from '@/types/game';
import { ENVIRONMENTS } from '@/env';

interface EnvironmentSelectorProps {
  selectedEnv: string | null;
  selectedLevel: LevelType | null;
  onEnvChange: (env: string) => void;
  onLevelChange: (level: LevelType) => void;
}

const ENVIRONMENT_OPTIONS = ENVIRONMENTS.map((definition) => ({
  id: definition.id,
  name: definition.name,
}));

export function EnvironmentSelector({
  selectedEnv,
  selectedLevel,
  onEnvChange,
  onLevelChange,
}: EnvironmentSelectorProps) {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <Label className="text-xs uppercase tracking-[0.35em] text-slate-400">Environment</Label>
        <Select
          value={selectedEnv ?? ''}
          onValueChange={(value) => {
            if (!value) {
              return;
            }
            onEnvChange(value);
          }}
        >
          <SelectTrigger className="border-white/15 bg-white/10 text-left text-white">
            <SelectValue placeholder="Select environment" />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-slate-950/95 text-slate-100">
            {ENVIRONMENT_OPTIONS.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      {selectedEnv && (
        <section className="space-y-3">
          <Label className="text-xs uppercase tracking-[0.35em] text-slate-400">Level</Label>
          <Select value={selectedLevel || ''} onValueChange={(value) => onLevelChange(value as LevelType)}>
            <SelectTrigger className="border-white/15 bg-white/10 text-left text-white">
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-slate-950/95 text-slate-100">
              <SelectItem value={LevelEnum.LEVEL_1}>Level 1 - Basic</SelectItem>
              <SelectItem value={LevelEnum.LEVEL_2}>Level 2 - Advanced</SelectItem>
            </SelectContent>
          </Select>
        </section>
      )}
    </div>
  );
}
