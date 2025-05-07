import { getIndexerForChain } from '@/lib/getIndexerForChain'
import indexer from '@/lib/indexer'
import { _log } from '@/lib/utils/ts'
import * as circomlibjs from 'circomlibjs'

export function hexToBigint(hex: string | bigint): bigint {
  if (typeof hex === 'bigint') return hex
  if (hex.startsWith('0x')) return BigInt(hex)
  return BigInt('0x' + hex)
}

export function leBufferToBigint(buff: Uint8Array | bigint): bigint {
  if (typeof buff === 'bigint') {
    return buff
  }

  let res = 0n
  for (let i = 0; i < buff.length; i++) {
    const n = BigInt(buff[i])
    res = res + (n << BigInt(i * 8))
  }

  return res
}

export async function readRand(chain: number, nextIndex: number, numRand: number): Promise<string[]> {
  const res = await getIndexerForChain(chain).get('/lottery/rand-range', { params: { lastIndex: nextIndex, numRand } })
  return res.data
}

export async function secretLuck(chain: number, secret: string, nextIndex: number, numRand: number): Promise<number[]> {
  const mimcsponge = await (circomlibjs as any).buildMimcSponge()
  const rands = await readRand(chain, nextIndex, numRand)

  let wins: number[] = []
  for (let i = 0; i < 23; i++) wins.push(0)
  wins.push(rands.length)
  for (let i = 0; i < rands.length; i++) {
    const [betIndex, betRand] = rands[i].split(',')
    const bigBetIndex = hexToBigint(betIndex)
    const bigBetRand = hexToBigint(betRand)
    const dice =
      0b111111111111111111111111111111111111111111111111n &
      leBufferToBigint(
        mimcsponge.F.fromMontgomery(mimcsponge.multiHash([hexToBigint(secret), bigBetRand, bigBetIndex]))
      )
    const rew1 = dice & 0b1111111111n ? 0 : 2 ** 10
    const rew2 = dice & 0b11111111111111110000000000n ? 0 : 2 ** 16
    const rew3 = dice & 0b111111111111111111111100000000000000000000000000n ? 0 : 2 ** 22
    wins[0] += rew1 + rew2 + rew3
    for (let power = 1; power <= 10; power++) {
      const bigPower = BigInt(power)
      const newrew1 = dice & (0b1111111111n << bigPower) & 0b1111111111n ? 0 : 2 ** 10
      wins[power] += newrew1 + rew2 + rew3
    }
    for (let power = 11; power <= 16; power++) {
      const bigPower = BigInt(power)
      const newrew2 = dice & (0b11111111111111110000000000n << bigPower) & 0b11111111111111110000000000n ? 0 : 2 ** 16
      wins[power] += rew1 + newrew2 + rew3
    }
    for (let power = 17; power <= 22; power++) {
      const bigPower = BigInt(power)
      const newrew3 =
        dice &
        (0b111111111111111111111100000000000000000000000000n << bigPower) &
        0b111111111111111111111100000000000000000000000000n
          ? 0
          : 2 ** 22
      wins[power] += rew1 + rew2 + newrew3
    }
  }
  return wins
}
