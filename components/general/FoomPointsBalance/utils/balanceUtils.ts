import { erc20Abi, formatUnits, createPublicClient, http } from 'viem'
import { base, mainnet } from 'viem/chains'
import { AIRDROP1_TOKEN } from '@/lib/utils/constants/addresses'
import type { PublicClient } from 'viem'

/**
 * Create independent public clients for each network
 */
const baseClient = createPublicClient({
  chain: base,
  transport: http(base.rpcUrls.default.http[0]),
})

const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http(mainnet.rpcUrls.default.http[0]),
})

/**
 * Fetches FOOM Points balance from Base network
 */
export const fetchBaseBalance = async (userAddress: `0x${string}`): Promise<bigint> => {
  try {
    const balance = await baseClient.readContract({
      address: AIRDROP1_TOKEN[base.id],
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [userAddress],
    })
    return balance
  } catch (error) {
    console.log('Error fetching Base balance:', error)
    return 0n
  }
}

/**
 * Fetches FOOM Points balance from Ethereum mainnet
 */
export const fetchEthBalance = async (userAddress: `0x${string}`): Promise<bigint> => {
  try {
    const balance = await mainnetClient.readContract({
      address: AIRDROP1_TOKEN[mainnet.id],
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [userAddress],
    })

    return balance
  } catch (error) {
    console.log('Error fetching ETH balance:', error)
    return 0n
  }
}

/**
 * Calculates total FOOM Points balance from Base and Ethereum networks
 */
export const calculateTotalBalance = async (userAddress: `0x${string}`): Promise<string> => {
  const baseBalance = await fetchBaseBalance(userAddress)
  const ethBalance = await fetchEthBalance(userAddress)

  const totalBalance = baseBalance + ethBalance
  const formattedBalance = formatUnits(totalBalance, 18)

  return parseFloat(formattedBalance).toFixed(0)
}

/**
 * Interface for balance fetch result
 */
export interface BalanceResult {
  balance: string
  error?: string
}

/**
 * Main function to fetch and format FOOM Points balance
 */
export const fetchFoomPointsBalance = async (
  _publicClient: PublicClient | undefined,
  userAddress: `0x${string}` | undefined
): Promise<BalanceResult> => {
  if (!userAddress) {
    return { balance: '0', error: 'Missing user address' }
  }

  try {
    const balance = await calculateTotalBalance(userAddress)
    return { balance }
  } catch (error) {
    console.error('Error fetching FOOM Points balance:', error)
    return { balance: '0', error: 'Failed to fetch balance' }
  }
}
