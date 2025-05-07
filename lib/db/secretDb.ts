import Dexie, { Table } from 'dexie'

export interface SecretEntry {
  /**
   * @dev The secret value to store
   */
  secret: string
}

class SecretDB extends Dexie {
  secret_001!: Table<SecretEntry>

  constructor() {
    super('SecretDB')
    this.version(1).stores({
      secret_001: 'secret',
    })
  }

  async setSecret(secret: string): Promise<void> {
    await this.secret_001.clear()
    await this.secret_001.add({ secret })
  }

  async getSecret(): Promise<string | undefined> {
    const entry = await this.secret_001.toCollection().first()
    return entry?.secret
  }

  async clearSecret(): Promise<void> {
    await this.secret_001.clear()
  }
}

export const secretDB = new SecretDB()
