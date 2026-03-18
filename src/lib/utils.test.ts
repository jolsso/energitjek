import { describe, it, expect } from 'vitest'
import { formatKwh, formatDkk, formatPct, cn } from './utils'

describe('formatKwh', () => {
  it('formats with 0 decimals by default', () => {
    expect(formatKwh(1234)).toBe('1234 kWh')
  })

  it('rounds to specified decimals', () => {
    expect(formatKwh(1.456, 1)).toBe('1.5 kWh')
    expect(formatKwh(1.456, 2)).toBe('1.46 kWh')
  })

  it('formats zero', () => {
    expect(formatKwh(0)).toBe('0 kWh')
  })

  it('formats negative values', () => {
    expect(formatKwh(-50)).toBe('-50 kWh')
  })
})

describe('formatDkk', () => {
  it('formats with 0 decimals by default', () => {
    expect(formatDkk(1234)).toBe('1234 kr.')
  })

  it('rounds to specified decimals', () => {
    expect(formatDkk(9.996, 2)).toBe('10.00 kr.')
    expect(formatDkk(1.1, 1)).toBe('1.1 kr.')
  })

  it('formats zero', () => {
    expect(formatDkk(0)).toBe('0 kr.')
  })

  it('formats negative values', () => {
    expect(formatDkk(-500)).toBe('-500 kr.')
  })
})

describe('formatPct', () => {
  it('formats with 1 decimal by default', () => {
    expect(formatPct(33.333)).toBe('33.3 %')
  })

  it('formats with specified decimals', () => {
    expect(formatPct(100, 0)).toBe('100 %')
    expect(formatPct(12.3456, 2)).toBe('12.35 %')
  })

  it('formats zero', () => {
    expect(formatPct(0)).toBe('0.0 %')
  })

  it('formats values over 100', () => {
    expect(formatPct(120.5)).toBe('120.5 %')
  })
})

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('resolves Tailwind conflicts (last wins)', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('ignores falsy values', () => {
    expect(cn('foo', false && 'bar', undefined, null, 'baz')).toBe('foo baz')
  })

  it('returns empty string for no input', () => {
    expect(cn()).toBe('')
  })
})
