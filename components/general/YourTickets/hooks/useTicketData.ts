import { useCallback, useEffect, useRef, useState } from 'react'
import { useChainId } from 'wagmi'
import { leavesDB, type LeafEntry } from '@/lib/db/leavesDb'
import { _redact } from '@/lib/lottery'
import { processTickets } from '@/lib/lottery/reward'
import { _log } from '@/lib/utils/ts'
import { useLottery } from '@/providers/LotteryProvider'
import { getTicketPrice } from '../utils/formatters'
import { useFoomPrice } from '@/hooks/useFoomPrice'

export function useTicketData() {
  const [ticketResults, setTicketResults] = useState<Record<string, any>>({})
  const didFetchOnFirstTickets = useRef(false)
  const lottery = useLottery()
  const chainId = useChainId()
  const { data: foomPrice } = useFoomPrice()

  const updateTicketResults = useCallback(
    async (customLeafs?: LeafEntry[]) => {
      const leafs = customLeafs ?? lottery.tickets
      if (!leafs?.length) {
        return
      }

      const validTickets = leafs.filter(ticket => !!ticket.secret)
      const resultsArr = await processTickets(validTickets)
      const results: Record<string, any> = {}

      if (Array.isArray(resultsArr)) {
        resultsArr.forEach(result => {
          if (result && typeof result.index === 'number') {
            const key = `${result.index}-${chainId}`
            results[key] = result
          }
        })
      }

      setTicketResults(results)
      _log('Updated ticket rewards:', _redact(resultsArr))
    },
    [lottery.tickets, chainId]
  )

  useEffect(() => {
    async function handleLeavesDbChanged() {
      _log("LeavesDB changed (rand's were changed): re-calculating ticket results")

      const newData = await leavesDB.getAll(chainId)

      if (lottery.setTickets) {
        /** @dev trigger GUI refresh */
        lottery.setTickets.refresh(newData)
      }

      updateTicketResults(newData)
    }
    window.addEventListener('leavesDbChanged', handleLeavesDbChanged)

    return () => {
      window.removeEventListener('leavesDbChanged', handleLeavesDbChanged)
    }
  }, [updateTicketResults, chainId, lottery.setTickets])

  /**
   * @dev fetches rands on new last index prop (lottery
   * tree has advanced – new lottery results are available). */
  /** @dev triggers initial result fetch (on page load) */
  useEffect(() => {
    if (!lottery?.tickets?.length) {
      return
    }

    updateTicketResults()
  }, [lottery.lastLeaf?.nextIndex, updateTicketResults])

  const processedData = [...lottery.tickets]
    .filter((t: any) => typeof t === 'object' && t !== null)
    .map((ticket: any) => {
      const hasSecret = typeof ticket.secret === 'string' && !!ticket.secret
      const secret = hasSecret ? ticket.secret : '(missing)'
      const key = typeof ticket.index === 'number' ? `${ticket.index}-${chainId}` : undefined
      const result = hasSecret && key ? ticketResults[key] : undefined
      let status = hasSecret ? 'Pending' : 'Malformed'
      let reward = hasSecret ? '-' : '—'

      if (result) {
        if (result.reward && result.reward !== '0.0' && result.reward !== '0') status = 'Jackpot!'
        else status = 'Lost!'
        reward = result
      }

      return {
        time: ticket.date ? ticket.date : '-',
        secret,
        price: getTicketPrice(ticket.power, foomPrice),
        status,
        reward,
        ticket: secret,
        power: ticket.power,
        index: ticket.index,
        chain: ticket.chain,
        malformed: !hasSecret,
      }
    })
    .sort((a, b) => {
      const dateA = a.time && a.time !== '-' ? new Date(a.time).getTime() : 0
      const dateB = b.time && b.time !== '-' ? new Date(b.time).getTime() : 0
      return dateB - dateA
    })

  return {
    processedData,
    ticketResults,
  }
}
