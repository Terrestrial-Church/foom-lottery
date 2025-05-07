import { useLottery } from '@/providers/LotteryProvider'
import { toast } from 'sonner'
import { _log } from '@/lib/utils/ts'

interface UseCheckTicketLogicProps {
  redeemHex: string
  setHash: (hash: string) => void
  setWitness: (witness: any) => void
  setReward: (reward: any) => void
  handleStatus: (status: string) => void
}

export function useCheckTicketLogic({
  redeemHex,
  setHash,
  setWitness,
  setReward,
  handleStatus,
}: UseCheckTicketLogicProps) {
  const { handleRedeem } = useLottery()

  const handleCheckTicket = async () => {
    if (redeemHex?.length !== 66) {
      toast('Please enter a valid lottery ticket (hex string of 66 characters, with 0x prefix)')
      return
    }

    const result = await handleRedeem()

    const hash = result?.hash

    _log('Redeem result:', result)
    _log('Proof as hex:', JSON.stringify(result?.proof?.witness?.raw?.proof, null, 2))
    const proof = result?.proof?.input
    const relayerResponse = result?.proof?.result

    if (hash) {
      handleStatus(`Ticket hash: ${hash}`)

      setHash(hash)
      setWitness(result?.proof?.witness)
      setReward(result?.reward)
      _log('Reward info:', result?.reward)
    }

    /** @dev save checked ticket to user's ticket list */
    /** TBD: Move this out of here into an importing component; handle via IDB instead of updating this in-memory store */
    // if (redeemHex && result?.index) {
    //   const ticketSecret = BigInt(redeemHex)
    //   const power = Number(ticketSecret & 0xffn)
    //   await setTickets.add({
    //     chain: 'current_blockchain_request_chain_id',
    //     secret: redeemHex as `0x${string}`,
    //     index: Number(result?.index),
    //     power,
    //     date: new Date().toISOString(),
    //   })
    // }

    result?.proof ? handleStatus(`Redeem result: ${JSON.stringify(result?.proof, null, 2)}`) : undefined
  }

  return handleCheckTicket
}
