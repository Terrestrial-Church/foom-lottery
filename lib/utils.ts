import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Address, Hex } from 'viem'
import { base, mainnet } from 'viem/chains'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type UniqueByKey<T> = (array: T[], key: keyof T) => T[]

export const removeDuplicatesByKey: UniqueByKey<any> = (array, key) => {
  return array.filter((obj1, i, arr) => arr.findIndex(obj2 => obj2[key] === obj1[key]) === i)
}

export const getLastHash = () => {
  if (typeof window === 'undefined') {
    return null
  }

  const stored = localStorage.getItem('lotteryHashes')
  if (stored) {
    try {
      const hashes = JSON.parse(stored)
      return hashes[hashes.length - 1]
    } catch {
      return null
    }
  }

  return null
}

export const toAddress = (value: string | number | bigint | Hex): Address | undefined => {
  let bigIntValue
  if (typeof value === 'bigint') {
    bigIntValue = value
  } else if (typeof value === 'number') {
    bigIntValue = BigInt(value)
  } else if (typeof value === 'string') {
    bigIntValue = BigInt(value)
  } else {
    return undefined
  }

  let hex = bigIntValue.toString(16)
  hex = hex.padStart(40, '0')

  return ('0x' + hex) as Address
}

/**
 * Formats a number as a USD price string (e.g., $0.00). Returns undefined for invalid input
 * @param value The number to format as USD
 * @returns $number.numbernumber | undefined
 */
export function formatUsd(value?: number | null): string | undefined {
  if (typeof value !== 'number' || isNaN(value)) {
    return undefined
  }
  return `$${value.toFixed(2)}`
}

/**
 * Returns the block explorer base URL for a given chain ID.
 * @param chain The chain ID (EVM network)
 * @returns The explorer base URL as a string
 */
export function getExplorer(chain: number): string {
  switch (chain) {
    case base.id:
      return 'https://basescan.org'
    case mainnet.id:
      return 'https://etherscan.io'
    default:
      return 'https://etherscan.io'
  }
}
