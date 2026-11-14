'use client';

import * as React from 'react';
import * as RadixSlider from '@radix-ui/react-slider';
import { cn } from '@/utils/cn';

export interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  className?: string;
  'aria-label': string;
}

export function Slider({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  className,
  ...aria
}: SliderProps) {
  return (
    <RadixSlider.Root
      className={cn('relative flex h-5 w-full touch-none select-none items-center', className)}
      value={[value]}
      min={min}
      max={max}
      step={step}
      onValueChange={(values) => {
        const next = values[0];
        if (next !== undefined) onValueChange(next);
      }}
      {...aria}
    >
      <RadixSlider.Track className="relative h-1.5 grow rounded-full bg-ink/10">
        <RadixSlider.Range className="absolute h-full rounded-full bg-capital" />
      </RadixSlider.Track>
      <RadixSlider.Thumb className="block h-5 w-5 rounded-full border-2 border-capital bg-paper shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-capital" />
    </RadixSlider.Root>
  );
}
