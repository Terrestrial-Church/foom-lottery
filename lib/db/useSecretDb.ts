import { useEffect } from 'react'
import { secretDB } from '@/lib/db/secretDb'
import type { Hex } from 'viem'

/**
 * Loads the secret from IndexedDB and sets it in the input on mount.
 * @param setSecret React state setter for the secret input
 */
export function useRestoreSecret(setSecret: (secret: Hex) => void) {
  useEffect(() => {
    secretDB.getSecret().then(secret => {
      if (secret) setSecret(secret as Hex)
    })
  }, [])
}

/**
 * Stores the secret in IndexedDB whenever it changes.
 * @param secret The secret value to store
 */
export function useStoreSecret(secret: Hex | undefined) {
  useEffect(() => {
    if (secret && /^0x[0-9a-fA-F]{62}$/.test(secret)) {
      secretDB.setSecret(secret)
    }
  }, [secret])
}
