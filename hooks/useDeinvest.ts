import { useCallback } from 'react'
import { useLocalStorage } from 'usehooks-ts'

export const DEINVEST_LS_KEY = 'foomcash-deinvestments'

export interface DeinvestAction {
  date: string
  amountFoom: string
}

export function useDeinvest() {
  const [deinvests, setDeinvests] = useLocalStorage<DeinvestAction[]>(DEINVEST_LS_KEY, [])

  const addDeinvest = useCallback(
    (amountFoom: string) => {
      const newAction = {
        date: new Date().toISOString(),
        amountFoom,
      }

      setDeinvests([...deinvests, newAction])
    },
    [deinvests?.length, setDeinvests]
  )

  return { deinvests, addDeinvest }
}
