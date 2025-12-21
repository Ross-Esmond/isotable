import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ClassValue } from 'clsx';

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs));
}

export type vector2 = [number, number];

export function smoothPosition(t: number, p1: vector2, p2: vector2): vector2 {
  const [p1x, p1y] = p1;
  const [p2x, p2y] = p2;

  const p1Coeff = Math.cos(Math.PI * t) / 2 + 1 / 2;
  const p2Coeff = -Math.cos(Math.PI * t) / 2 + 1 / 2;

  return [p1x * p1Coeff + p2x * p2Coeff, p1y * p1Coeff + p2y * p2Coeff];
}

export const smoothSteps = 250; // milliseconds
