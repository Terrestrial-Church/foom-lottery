import { _redact } from '@/lib/lottery'
import { DEFAULT_CHAIN } from '@/lib/lottery/db'
import { _log, assertIsHex } from '@/lib/utils/ts'
import Dexie, { Table } from 'dexie'
import { base, type mainnet } from 'viem/chains'

export interface LeafEntry {
  /**
   * @dev {int}
   * e.g. 22708
   */
  index?: number
  /**
   * @dev {hex} 0x + 62 chars
   * e.g. "0x7160bdafc4fce5106d363715251d90a33111dd3390ce94110808190555f6b1"
   */
  secret: string
  /**
   * @dev {hex}
   * e.g. 21
   */
  power: number
  /**
   * @dev {bigint}
   * e.g. "124446685289692360373959275966672478944"
   */
  rand?: string
  /**
   * @dev {ISO}
   * e.g. "2025-06-20T21:47:02.265Z"
   */
  date?: string
  /**
   * @dev {number} Chain ID for the bet
   */
  chain: typeof base.id | typeof mainnet.id | -1 | number
}

const EVENT_LEAVES_DB_CHANGED = 'leavesDbChanged'

class LeavesDB extends Dexie {
  leaves_002!: Table<LeafEntry>
  _leaves_001!: Table<any>

  constructor() {
    super('LeavesDB')

    this.version(1).stores({
      /** @dev legacy, for migration only */
      leaves: 'index',
      leaves_002: '[chain+index],[chain+secret+power]',
    })

    /** @dev migration run */
    this.open().then(() => this.migrate())
  }

  /**
   * @deprecated note: just use the new format; legacy formats data will
   * just be dumped into tickets list and eventually hidden.
   */
  async migrate() {
    return

    /** @dev lock tables considered */
    await this.transaction('rw', this.table('leaves'), this.leaves_002, async () => {
      /** TBD: 002 -> 002_eth, 002_base */
      const oldLeaves = await this.table('leaves').toArray()
      if (!(oldLeaves?.length > 0)) {
        return
      }

      /** @dev reformat data for new schema -- ensure chain */
      const migratedLeaves = oldLeaves.map(l => ({ ...l, chain: l.chain ?? DEFAULT_CHAIN }))
      _log('Leaves to migrate from `leaves`:', _redact(migratedLeaves))

      const keys = migratedLeaves.map(l => [l.chain, l.index])
      const existing = await this.leaves_002.where('[chain+index]').anyOf(keys).toArray()
      const merged = migratedLeaves.map(migrated => {
        const found = existing.find(
          existing => `${existing.chain}` === `${migrated.chain}` && `${existing.index}` === `${migrated.index}`
        )
        return found ? { ...found, ...migrated } : migrated
      })

      await this.leaves_002.bulkPut(merged)
      _log('Merged `leaves` have been bulk-put into `leaves_002`:', _redact(merged))
    })
  }

  async getAll(chain: number): Promise<LeafEntry[]> {
    return await this.leaves_002.where('chain').equals(chain).toArray()
  }

  async getAllTickets(chain: number): Promise<LeafEntry[]> {
    return await this.leaves_002
      .where('chain')
      .equals(chain)
      .filter(leaf => assertIsHex(leaf.secret))
      .toArray()
  }

  async add(leaf: LeafEntry): Promise<number> {
    return await this.leaves_002.add(leaf)
  }

  /**
   * NOTE: Emits on change
   */
  async addAndEmit(leaf: LeafEntry): Promise<number> {
    const result = await this.leaves_002.add(leaf)
    window?.dispatchEvent(new Event(EVENT_LEAVES_DB_CHANGED))
    return result
  }

  /**
   * NOTE: Emits on change
   */
  async putAndEmit(leaf: LeafEntry): Promise<number> {
    const result = await this.leaves_002.put(leaf)
    window?.dispatchEvent(new Event(EVENT_LEAVES_DB_CHANGED))
    return result
  }

  /**
   * NOTE: Emits on change
   */
  async bulkPutLeavesAndEmit(leaves: LeafEntry[]): Promise<void> {
    await this.leaves_002.bulkPut(leaves)
    window?.dispatchEvent(new Event(EVENT_LEAVES_DB_CHANGED))
  }

  /**
   * Patch a single leaf by merging fields with the existing record (does not remove other fields)
   */
  async patchLeaf(
    index: number,
    patch: Omit<Partial<LeafEntry>, 'chain'> & { chain: LeafEntry['chain'] },
    emit: boolean = true
  ): Promise<void> {
    const chain = patch.chain

    /** @dev use compound */
    const id = [chain, index]

    const existing = await this.leaves_002.get(id)
    if (existing) {
      await this.leaves_002.put({ ...existing, ...patch, index, chain })
    } else {
      await this.leaves_002.put({
        index,
        secret: patch.secret ?? '',
        power: patch.power ?? 0,
        rand: patch.rand,
        date: patch.date,
        ...patch,
      })
    }
    if (emit) {
      window?.dispatchEvent(new Event(EVENT_LEAVES_DB_CHANGED))
    }
  }

  /**
   * Patch multiple leaves by merging fields with the existing records (does not remove other fields)
   */
  async patchLeaves(patches: Array<{ index: number; patch: Partial<LeafEntry> }>, emit: boolean = true): Promise<void> {
    /** @dev [chain, index] pairs build for lookup */
    const pairs = patches.map(p => [p.patch.chain ?? DEFAULT_CHAIN, p.index])
    const existingLeaves = await this.leaves_002.where('[chain+index]').anyOf(pairs).toArray()

    const merged = patches
      .map(({ index, patch }) => {
        const chain = patch.chain ?? DEFAULT_CHAIN
        const existing = existingLeaves.find(l => l.index === index && l.chain === chain)
        if (existing) {
          return { ...existing, ...patch, index, chain }
        } else {
          return { ...patch, index, chain } as LeafEntry
        }
      })
      .filter(Boolean) as LeafEntry[]
    if (merged.length) {
      await this.leaves_002.bulkPut(merged)
      if (emit) {
        window?.dispatchEvent(new Event(EVENT_LEAVES_DB_CHANGED))
      }
    }
  }
}

export const leavesDB = new LeavesDB()
