import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// HH:MM-HH:MM → H-H (분이 둘 다 '00'일 때만 변경, 아니면 원본 유지)
export function formatHourRange(label: string): string {
  const m = label.match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/);
  if (!m) return label;
  const [, h1, m1, h2, m2] = m;
  if (m1 === '00' && m2 === '00') {
    const s = String(Number(h1)); // 선행 0 제거
    const e = String(Number(h2));
    return `${s}-${e}`;
  }
  return label;
}