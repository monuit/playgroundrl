'use client';

import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { EnvironmentType, LevelType } from '@/types/game';
import { EnvironmentType as EnvEnum, LevelType as LevelEnum } from '@/types/game';

interface EnvironmentSelectorProps {
  selectedEnv: EnvironmentType | null;
  selectedLevel: LevelType | null;
  onEnvChange: (env: EnvironmentType) => void;
  onLevelChange: (level: LevelType) => void;
}

const ENVIRONMENT_LABELS: Record<EnvironmentType, string> = {
  [EnvEnum.BUNNY_GARDEN]: 'Bunny Garden',
  [EnvEnum.SWARM_DRONES]: 'Swarm Drones',
  [EnvEnum.REEF_GUARDIANS]: 'Reef Guardians',
  [EnvEnum.WAREHOUSE_BOTS]: 'Warehouse Bots',
  [EnvEnum.SNOWPLOW_FLEET]: 'Snowplow Fleet',
};

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
          value={selectedEnv || ''}
          onValueChange={(value) => onEnvChange(value as EnvironmentType)}
        >
          <SelectTrigger className="border-white/15 bg-white/10 text-left text-white">
            <SelectValue placeholder="Select environment" />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-slate-950/95 text-slate-100">
            {Object.entries(ENVIRONMENT_LABELS).map(([env, label]) => (
              <SelectItem key={env} value={env}>
                {label}
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
