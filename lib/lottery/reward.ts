import type { Hex } from 'viem'
import { leavesDB, type LeafEntry } from '../db/leavesDb'
import { _log, safeDecimalToHex } from '@/lib/utils/ts'
import { _redact } from '@/lib/lottery'

interface IResult {
  maskedBits: string[]
  reward: string
  maskBits: string[]
  bits: string[]

  secret: `0x${string}`
  power: number
  index: number
}

export interface RewardResult {
  status: 'Waiting' | 'Lost' | 'Jackpot!'
  reward: string
  maskBits: string
  bits: string
}

/**
 * Retrieves the betRand from leavesDB for the given [chain, index].
 * @param chain Chain ID of the tree to query
 * @param index Index of the leaf
 * @returns [betIndex, betRand]
 */
async function retrieveLeaf(chain: number, index: number): Promise<[number, bigint]> {
  let betRand = 0n

  try {
    const leaf = await leavesDB.leaves_002.get([chain, index])
    if (leaf && typeof leaf.index === 'number') {
      if (leaf.rand) {
        betRand = BigInt(leaf.rand)
      }
      return [leaf.index, betRand]
    }
  } catch {}

  return [0, 0n]
}

/**
 * Processes tickets with limited concurrency using a queue.
 * @param tickets Array of LeafEntry tickets
 * @param concurrency Number of workers to run in parallel (default: 2)
 */
export async function processTickets(tickets: LeafEntry[], concurrency = 2): Promise<IResult[]> {
  const ticketData = await Promise.all(
    tickets.map(async ticketInput => {
      const [betIndex, betRand] = await retrieveLeaf(ticketInput.chain, ticketInput.index!)

      return { ...ticketInput, betIndex, betRand }
    })
  )

  const results: (IResult | undefined)[] = []
  let i = 0

  async function worker() {
    while (i < ticketData.length) {
      const _i = i++

      const { secret, power, index, rand } = ticketData[_i]
      results[_i] = await runTicketWorker({ secret, power, index, rand })
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker())
  await Promise.all(workers)

  _log(`[Main] All tickets processed.`)
  return results.filter((r): r is IResult => r !== undefined)
}

function runTicketWorker(ticket: Pick<LeafEntry, 'secret' | 'power' | 'index' | 'rand'>): Promise<IResult | undefined> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./ticketWorker.ts', import.meta.url), { type: 'module' })
    _log(`[TicketWorker] Processing…:`, ticket.index)

    worker.onmessage = e => {
      if (e.data) {
        _log(`[TicketWorker] Processed:`, _redact(ticket), 'Result:', _redact(e.data))
      } else {
        _log(`[TicketWorker] Skipped:`, _redact(ticket))
      }

      resolve(e.data ?? undefined)
      worker.terminate()
    }

    worker.onerror = err => {
      console.error(`[TicketWorker] Error processing:`, ticket, err)

      resolve(undefined)
      worker.terminate()
    }

    worker.postMessage({ ticket })
  })
}
