/**
 * Game HUD - controls, level select, and stats
 */
'use client';

import { useState } from 'react';
import { Play, Pause, RotateCcw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LevelConfig } from './types';

interface HudProps {
  level: LevelConfig;
  tick: number;
  paused: boolean;
  onPauseToggle: () => void;
  onReset: () => void;
  onLevelChange: (levelId: 'level1' | 'level2') => void;
  onTickDurationChange: (duration: number) => void;
}

export function Hud({
  level,
  tick,
  paused,
  onPauseToggle,
  onReset,
  onLevelChange,
  onTickDurationChange,
}: HudProps) {
  const [speed, setSpeed] = useState(100);

  const handleSpeedChange = (value: number[]) => {
    const val = value[0];
    setSpeed(val);
    // Invert: higher speed = lower duration
    const duration = 200 - (val - 20); // Map 20-180 to 180-20 ms
    onTickDurationChange(Math.max(50, duration));
  };

  return (
    <div className="bg-slate-900 border-t border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between gap-6">
        {/* Level Select */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-400">Level:</span>
          <Select value={level.id} onValueChange={(val) => onLevelChange(val as 'level1' | 'level2')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="level1">Level 1: Static</SelectItem>
              <SelectItem value="level2">Level 2: Moving</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={paused ? 'default' : 'secondary'}
            onClick={onPauseToggle}
            className="gap-2"
          >
            {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            {paused ? 'Play' : 'Pause'}
          </Button>
          <Button size="sm" variant="outline" onClick={onReset} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>

        {/* Speed Control */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium w-12">Speed:</span>
          </div>
          <input
            type="range"
            min="20"
            max="180"
            value={speed}
            onChange={(e) => handleSpeedChange([parseInt(e.target.value)])}
            className="w-32"
          />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-slate-400">Tick:</span>
            <span className="font-mono ml-2 text-cyan-400">{tick}</span>
          </div>
          <div>
            <span className="text-slate-400">Status:</span>
            <span className="font-mono ml-2 text-emerald-400">{paused ? 'PAUSED' : 'RUNNING'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
