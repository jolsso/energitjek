import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatKwh(kwh: number, decimals = 0): string {
  return `${kwh.toFixed(decimals)} kWh`
}

export function formatDkk(dkk: number, decimals = 0): string {
  return `${dkk.toFixed(decimals)} kr.`
}

export function formatPct(pct: number, decimals = 1): string {
  return `${pct.toFixed(decimals)} %`
}
