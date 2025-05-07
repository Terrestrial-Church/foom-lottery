import { _log, safeDecimalToHex } from '@/lib/utils/ts'
import type { Hex } from 'viem'

export const toSecretPower = (secret: bigint, power: bigint | number): Hex =>
  (safeDecimalToHex(secret) + Number(power).toString(16).padStart(2, '0')) as Hex

/**
 * Recursively redacts all string properties in an object that start with '0x' and are 62 or 64 or 66 chars long.
 * Truncates them to first 6 chars, '…', and last 4 chars.
 * @param obj The object to redact
 * @returns The redacted object (shallow copy)
 */
export function _redact<T>(obj: T | T[]): T | T[] {
  if (typeof obj === 'string') {
    if (obj.startsWith('0x') && obj.includes(',')) {
      const [first, ...rest] = obj.split(',')

      if ([62, 64, 66].includes(first.length)) {
        const redacted = first.slice(0, 8) + '…' + first.slice(-2)
        return [redacted, ...rest].join(',') as T
      }
    }

    if (obj.startsWith('0x') && [62, 64, 66].includes(obj.length)) {
      return (obj.slice(0, 6) + '…' + obj.slice(-4)) as T
    }
    return obj
  }

  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(_redact) as T[]
  }

  const redact = (val: any): any => {
    if (typeof val === 'string') {
      if (val.startsWith('0x') && val.includes(',')) {
        const [first, ...rest] = val.split(',')
        if ([62, 64, 66].includes(first.length)) {
          const redacted = first.slice(0, 6) + '…' + first.slice(-4)
          return [redacted, ...rest].join(',')
        }
      }
      if (val.startsWith('0x') && [62, 64, 66].includes(val.length)) {
        return val.slice(0, 6) + '…' + val.slice(-4)
      }
    }

    if (val && typeof val === 'object') {
      return _redact(val)
    }
    return val
  }

  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, redact(v)])) as T
}

/**
 * @param bits 1 | 2 | 4 | 7 | 3 | 6
 */
export const bitsToReward = (bits: number | bigint, isUsd?: { foomPrice: number }) => {
  const bits_ = Number(bits)
  let reward = 0
  if (bits_ & 1) reward += 2 ** 10
  if (bits_ & 2) reward += 2 ** 16
  if (bits_ & 4) reward += 2 ** 22

  const foom = reward * 10 ** 6
  return isUsd?.foomPrice ? foom * isUsd.foomPrice : foom
}

export const secretPowerToSecret = (secretPower: Hex): Hex => safeDecimalToHex(BigInt(secretPower) >> 8n)
