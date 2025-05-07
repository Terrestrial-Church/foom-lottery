import Dexie, { Table } from 'dexie'

export interface PathEntry {
  index: number
  pathElements: string[]
  blockNumber?: number
}

class TreeDB extends Dexie {
  paths!: Table<PathEntry>

  constructor() {
    super('TreeDB')

    this.version(1).stores({
      paths: 'index',
    })
  }
}

export const treeDB = new TreeDB()
