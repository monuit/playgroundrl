export interface Schedule {
  value(step: number): number;
}

export class LinearSchedule implements Schedule {
  constructor(
    private readonly start: number,
    private readonly end: number,
    private readonly duration: number
  ) {}

  value(step: number) {
    if (step >= this.duration) {
      return this.end;
    }
    const progress = step / Math.max(this.duration, 1);
    return this.start + (this.end - this.start) * progress;
  }
}

export class ExponentialSchedule implements Schedule {
  constructor(
    private readonly start: number,
    private readonly end: number,
    private readonly decay: number
  ) {}

  value(step: number) {
    return this.end + (this.start - this.end) * Math.exp(-this.decay * step);
  }
}
