import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string): string {
  return name
    .split(/[\s·—-]+/)
    .filter(Boolean)
    .slice(0, 1)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('');
}

export function pingClass(ms: number): string {
  if (ms <= 30) return 'text-success';
  if (ms <= 80) return 'text-warning';
  return 'text-destructive';
}
