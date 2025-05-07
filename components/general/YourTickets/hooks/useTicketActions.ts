import { useState } from 'react'
import { toast } from 'sonner'
import { toSecretPower } from '@/lib/lottery'
import { useLottery } from '@/providers/LotteryProvider'

export function useTicketActions() {
  const [claiming, setClaiming] = useState<Record<string, boolean>>({})
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; ticket: string | null; index: number | null }>({
    open: false,
    ticket: null,
    index: null,
  })
  const lottery = useLottery()

  const handleClaim = async (secret: bigint, power: number, index: number) => {
    const secretPower = toSecretPower(secret, power)

    setClaiming(prev => ({ ...prev, [secretPower]: true }))
    try {
      lottery.setRedeemHex(secretPower)
      lottery.setRedeemIndex(index)

      toast('Calculating proof, please wait...')
      await new Promise(resolve => setTimeout(resolve, 1000))

      if (typeof window !== 'undefined' && window?.openCheckTicketModal) {
        window?.openCheckTicketModal()
      }
    } catch {}
    setClaiming(prev => ({ ...prev, [secretPower]: false }))
  }

  const handleDeleteTicket = (ticket: string, index: number) => {
    setConfirmDelete({ open: true, ticket, index })
  }

  const confirmDeleteAction = async () => {
    if (confirmDelete.ticket && confirmDelete.index !== null) {
      await lottery.setTickets.remove(confirmDelete.ticket as `0x${string}`, confirmDelete.index)
      toast('Ticket deleted')
      setConfirmDelete({ open: false, ticket: null, index: null })
    }
  }

  const cancelDeleteAction = () => {
    setConfirmDelete({ open: false, ticket: null, index: null })
  }

  return {
    claiming,
    confirmDelete,
    handleClaim,
    handleDeleteTicket,
    confirmDeleteAction,
    cancelDeleteAction,
  }
}
