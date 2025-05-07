import indexer from '@/lib/indexer'
import { shortenAddress } from '@/lib/utils/parser'
import CyberpunkWall from '@/pages/wall'
import { useLottery } from '@/providers/LotteryProvider'
import { useAppKitState } from '@reown/appkit/react'
import React, { useState, useEffect } from 'react'
import { useAccount, usePublicClient, useWalletClient, useChainId, useSwitchChain } from 'wagmi'
import { base } from 'viem/chains'
import { AIDROP1_CONTRACT, AIRDROP1_TOKEN } from '@/lib/utils/constants/addresses'
import { AIDROP_CAMPAIN_ABI } from '@/lib/utils/constants/aidropCampain'
import { useLotteryContract } from '@/lib/lottery/hooks/useLotteryContract'
import { toast } from 'sonner'
import { _log } from '@/lib/utils/ts'
import { RoundSpinner } from '@/components/ui/RoundSpinner'
import FoomPointsBalance from '@/components/general/FoomPointsBalance'
import { getIndexerForChain } from '@/lib/getIndexerForChain'

const Mint = () => {
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [followed, setFollowed] = useState(false)
  const [isMinting, setIsMinting] = useState(false)
  const [ref0x, setRef0x] = useState('')
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const targetDate = new Date('2025-08-01T00:00:00Z')
  const [holders, setHolders] = useState([])
  const [stats, setStats] = useState<any>({})

  const { address: userAddress } = useAccount()
  const lottery = useLottery()

  const userWallet = useAppKitState()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const chainId = useChainId()
  const { switchChainAsync } = useSwitchChain()
  const [tickets, setTickets] = useState<any[]>([])
  const { getHash, getAmountEthForPower } = useLotteryContract({ tickets, setTickets })

  const addTokenToMetaMask = async () => {
    try {
      const wasAdded = await (window as any)?.ethereum?.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: AIRDROP1_TOKEN[base.id],
            symbol: 'Foom Points',
            name: 'F00M.Cash Points',
            decimals: 18,
            image: 'https://foom.cash/icon.svg',
          },
        },
      })

      if (wasAdded) {
        toast.info('Token added to MetaMask ✅')
      }
    } catch (error) {}
  }

  const handleMintClick = async () => {
    if (!followed) {
      window.open('https://x.com/foomclub_', '_blank')
      setFollowed(true)
      return
    }

    if (!userAddress) {
      alert('Connect your wallet first!')
      return
    }

    if (chainId !== base.id) {
      if (switchChainAsync) {
        await switchChainAsync({ chainId: base.id })
      } else {
        alert('Please switch to the Base network in your wallet and try again.')
      }
      return
    }

    if (!publicClient || !walletClient) {
      alert('Wallet or public client not available!')
      return
    }

    setIsMinting(true)
    try {
      const toastId = toast(
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RoundSpinner />
          <span>Generating data and sending your transaction…</span>
        </div>,
        { duration: Infinity }
      )
      const commitment = await getHash([`0x${Number(0).toString(16)}`, 0])
      const contractAddress = AIDROP1_CONTRACT[base.id]
      const secret = commitment.hash
      const power = 2
      const reflinkAddress = ref0x && /^0x[a-fA-F0-9]{40}$/.test(ref0x) ? ref0x : userAddress

      let ethPlayAmount: bigint | undefined = undefined
      if (typeof getAmountEthForPower === 'function') {
        ethPlayAmount = await getAmountEthForPower(power)
      }

      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi: AIDROP_CAMPAIN_ABI,
        functionName: 'mint',
        args: [secret, power, reflinkAddress],
        account: userAddress,
        ...(ethPlayAmount !== undefined ? { value: ethPlayAmount } : { value: 0n }),
      })

      await getIndexerForChain(chainId || base.id).post('/lottery/mint', {
        data: commitment.secret_power,
        hash: commitment.hash,
      })

      const txHash = await walletClient.writeContract(request)

      const successMessage = `Token minted! You should have received your coin by now. TX: ${txHash}`
      toast.success(successMessage)
      toast.dismiss(toastId)
      _log(successMessage)
    } catch (e: any) {
      toast.dismiss()

      const cause = e?.cause?.reason
      if (!!cause) {
        toast.error(`${cause}`)
        return
      }

      alert(e?.message || 'Mint failed')
    } finally {
      setIsMinting(false)
    }
  }

  const handleCopyRef = () => {
    const baseUrl = window.location.origin + window.location.pathname
    const userRefLink = `${baseUrl}?ref=${userAddress}`

    navigator.clipboard.writeText(userRefLink)
    alert('Reflink copied to clipboard!')
  }

  useEffect(() => {
    const ref0x = window.location.search.split('ref=')[1]
    if (ref0x) setRef0x(ref0x)
  }, [])

  useEffect(() => {
    console.log('userAddress', userAddress)
  }, [userAddress])

  useEffect(() => {
    ;(async () => {
      const response = await indexer.get(`blockchain/airdropHolders/${AIRDROP1_TOKEN[base.id]}/0x2105`)
      console.log('response', response)

      const airdropStats = response.data.airdropTokenStats
      const holders = response.data.holders

      console.log('airdropStats', airdropStats)
      console.log('holders', holders)

      setHolders(holders)
      setStats(airdropStats)
    })()
  }, [])

  if (userAddress === undefined || userAddress === null) {
    return (
      <div className="min-h-screen flex items-center justify-center  text-white text-center p-6">
        <div className="bg-zinc-900 rounded-xl shadow-xl p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4">🔌 Connect Wallet to Access Free Mint</h2>
          <p className="mb-6 text-white/80 text-sm">To join the FOOM.Cash Drop #1, connect your Ethereum wallet.</p>
          <button
            onClick={() => setIsWalletConnected(true)}
            className="w-full text-black font-bold py-3 rounded-xl transition-all"
          >
            <div className="flex items-center justify-center">
              <appkit-button />
            </div>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-pixel-bg bg-cover flex flex-col items-center justify-center text-center p-4 space-y-6">
      <h1>CYBERWALL {stats?.totalHolders} / 10 000</h1>
      <CyberpunkWall value={stats?.totalHolders * 10} />
      <h1 className="text-3xl md:text-5xl font-bold">FOOM.Cash FreeMint #1</h1>

      <p className="text-white/70 text-sm max-w-md">
        Join the unique campaign, count ZK Proof, learn more about F00M and receive a secret surprise token.
      </p>

      <div className="text-xl bg-black text-green-400 px-4 py-2 rounded-lg border border-green-500 shadow-inner">
        Airdrop Listing: {stats?.totalHolders} / 10,000 unique addresses
      </div>

      <button
        onClick={handleMintClick}
        disabled={isMinting}
        className={`w-full max-w-xs px-6 py-4 font-extrabold rounded-xl text-lg tracking-wide border-none shadow-[0_4px_15px_rgba(0,0,0,0.2)] transform transition-all duration-300 ease-in-out
    ${
      followed
        ? isMinting
          ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed'
          : 'bg-gradient-to-r from-green-400 to-green-500 text-white hover:scale-105 hover:shadow-[0_6px_20px_rgba(0,128,0,0.4)]'
        : 'bg-gradient-to-r from-yellow-300 to-yellow-400 text-black hover:scale-105 hover:shadow-[0_6px_20px_rgba(255,204,0,0.4)]'
    }
  `}
      >
        {followed ? (
          isMinting ? (
            <div className="flex items-center justify-center gap-2">
              <RoundSpinner />
              <span>Minting...</span>
            </div>
          ) : (
            '✅ Mint Now'
          )
        ) : (
          <span>
            <span className="invert">✨</span> Follow & Unlock Mint
          </span>
        )}
      </button>

      <FoomPointsBalance />

      <p className="text-neutral-200 text-sm max-w-md">
        More airdrops are on the way – stay tuned! Soon Ethereum Edition.
      </p>

      <div className="mt-4 space-y-2">
        <button
          onClick={handleCopyRef}
          className="bg-white text-black px-4 py-2 rounded-lg border border-black"
        >
          📋 Copy Reflink
        </button>
        <p className="text-white/65 text-sm">
          1 address = <strong>100 tokens</strong> | 1 referral = <strong>50 tokens</strong>
        </p>
      </div>

      <button
        onClick={addTokenToMetaMask}
        className="mt-4 bg-black border-2 border-white px-4 py-2 rounded-lg text-white hover:bg-white hover:text-black transition-all"
      >
        ➕ Add FOOM Token to MetaMask
      </button>

      <a
        href="https://foom.club/"
        className="text-blue-400 underline mt-4"
        target="_blank"
        rel="noopener noreferrer"
      >
        Learn more about the Foom Ecosystem
      </a>

      {/* Holder Distribution */}
      <div className="w-full max-w-md mt-12 p-6 rounded-xl bg-white/5 border border-white/10">
        <h2 className="text-xl font-bold text-pink-400 mb-4 text-center">Airdrop Holder Distribution</h2>
        <ul className="space-y-2 text-cyan-200 text-sm">
          <li className="flex justify-between border-b border-white/10 pb-1">
            <span>🦐 Shrimps</span>
            <span>{stats?.holderDistribution?.shrimps}</span>
          </li>
          <li className="flex justify-between border-b border-white/10 pb-1">
            <span>🐟 Fish</span>
            <span>{stats?.holderDistribution?.fish}</span>
          </li>
          <li className="flex justify-between border-b border-white/10 pb-1">
            <span>🦀 Crabs</span>
            <span>{stats?.holderDistribution?.crabs}</span>
          </li>
          <li className="flex justify-between border-b border-white/10 pb-1">
            <span>🐙 Octopus</span>
            <span>{stats?.holderDistribution?.octopus}</span>
          </li>
          <li className="flex justify-between border-b border-white/10 pb-1">
            <span>🐬 Dolphins</span>
            <span>{stats?.holderDistribution?.dolphins}</span>
          </li>
          <li className="flex justify-between border-b border-white/10 pb-1">
            <span>🦈 Sharks</span>
            <span>{stats?.holderDistribution?.sharks}</span>
          </li>
          <li className="flex justify-between pb-1">
            <span>🐳 Whales</span>
            <span>{stats?.holderDistribution?.whales}</span>
          </li>
        </ul>
      </div>

      {/* Leaderboard */}
      <div className="mt-12 w-full max-w-2xl text-white text-xs sm:text-sm px-2">
        <h2 className="text-lg sm:text-xl font-bold mb-4">🏆 Leaderboard</h2>
        <div className="overflow-x-auto">
          <table className="w-full border border-white/20 bg-white/5 rounded-lg text-left text-xs sm:text-sm">
            <thead className="bg-white/10">
              <tr>
                <th className="p-2 whitespace-nowrap">RANK</th>
                <th className="p-2 whitespace-nowrap">ADDRESS</th>
                <th className="p-2 whitespace-nowrap">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {holders.map((item: any, idx) => (
                <tr
                  key={idx}
                  className="border-t border-white/10 hover:bg-white/10"
                >
                  <td className="p-2 whitespace-nowrap">{idx + 1}</td>
                  <td className="p-2 break-all">{shortenAddress(item.address)}</td>
                  <td className="p-2 whitespace-nowrap">{item.amount} Tokens</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Mint
