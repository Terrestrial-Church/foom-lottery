import path from 'path'
import { groth16 } from 'snarkjs'
import { ethers } from 'ethers'
import {
  hexToBigint,
  bigintToHex,
  leBigintToBuffer,
  reverseBits,
  leBufferToBigint,
  bigintToHexRaw,
} from './utils/bigint'
import { pedersenHash } from './utils/pedersen'
import { buildMimcSponge } from 'circomlibjs'
import indexer from '../indexer'
import { AxiosResponse } from 'axios'
import { _log, _warn } from '@/lib/utils/ts'
import { toast } from 'sonner'
import { encodeAbiParameters, formatEther, hexToBigInt } from 'viem'
import { fetchProofPath } from '@/lib/lottery/fetchProofPath'
import { fetchLastLeaf } from '@/lib/lottery/fetchLastLeaf'
import { leavesDB } from '@/lib/db/leavesDb'
import { maskbits } from '@/lib/lottery/utils/bits'
import { BET_MIN } from '@/lib/lottery/constants'
import { getIndexerForChain } from '@/lib/getIndexerForChain'

// {
//   betIndex: number
//   betRand: bigint
//   nextIndex: number
// }
type BetResponse = [number, bigint, number]

// MIMC tree Element[]
type PathResponse = bigint[]

/**
 * Find by hash.
 * NOTICE: Unsafe:
 *  User has secret ->
 *  user generates hash ->
 *  user passes hash to API ->
 *  API knows what leaf the user wants ->
 *  the user must have known the secret that corresponded to it ->
 *  user matched (bet <=> user) ->
 *  privacy leaked.
 * NOTICE: The user (frontend client) should instead fetch randomized betIndexes instead of betHashes. Then:
 *  User has secret ->
 *  user generates hash ->
 *  user passes 5 or more random indexes (startIndexes) to API ->
 *  API does not know which of these 5 leaves the user wants (as user can guess an index easily – unlike guessing a hash) ->
 *  API returns the 5 corresponding paths ->
 *  user knows which of these 5 datum is the one they want ->
 *  user unmatched ->
 *  privacy preserved.
 *
 * In case of finding by index: user has to know the index of their bet made (blockchain transactsion
 *  emits it, can be collected from the TX receipt logs).
 * @param hash uint256
 * @param startIndex number | undefined the index of the bet in the tree, if known; will be used instead of the hash.
 * @returns
 */
async function findBet(
  chain: number,
  hash?: bigint,
  /** @dev auto-detected from the bet hash if not provided. If provided, hash is unused, to maximise privacy */
  startIndex?: number
): Promise<BetResponse> {
  try {
    const response: AxiosResponse<BetResponse> = await getIndexerForChain(chain).get('/lottery/leaf-pro', {
      params: {
        hash: bigintToHex(hash || 0n),
        index: startIndex,
      },
    })

    const result = response.data

    /** @dev save cache */
    if (result) {
      await leavesDB.patchLeaf(Number(result[0]), { rand: `${result[1]}`, chain })
    }

    return result
  } catch (error: any) {
    throw new Error(`Error fetching bet: ${error.message}`)
  }
}

/**
 * Finds bets by hashes or indices.
 * Caches the data found for reuse and better privacy
 *
 * @param chain Chain ID to identify the tree used
 */
async function findBets(
  chain: number,
  hashes?: bigint[],
  /** @dev auto-detected from the bet hash if not provided.
   * If provided, hash is unused to maximise privacy */
  indices?: number[]
): Promise<BetResponse[]> {
  try {
    const response: AxiosResponse<BetResponse[]> = await getIndexerForChain(chain).get('/lottery/leaves', {
      params: {
        chain,
        hashes: hashes?.map(hash => bigintToHex(hash || 0n)).filter(Boolean),
        indices,
      },
    })

    /** DB cache the `rand`s */
    if (response?.data?.length) {
      const leaves = response.data.map(([index, rand]) => ({
        index: Number(index),
        rand: `${rand}`,
        chain,
      }))

      await leavesDB.patchLeaves(
        leaves.map(leaf => ({
          index: leaf.index,
          patch: { rand: leaf.rand, chain: leaf.chain },
        }))
      )
    }

    return response.data
  } catch (error: any) {
    throw new Error(`Error fetching bet: ${error.message}`)
  }
}

/**
 * Finds bets, using random-path-fetching strategy (with `tries` number of tries), for preserving privacy.
 * Accepts an array of indices and returns a mapping from each index to its found bet.
 * @param indices Array of indices to find
 * @param tries Number of random indices to fetch per index (default: 5)
 * @param chain Chain ID to identify the tree used
 * @returns Object mapping each requested index to its found bet; [0, 0n, 0] if not found
 */
export async function findBetsSafe(chain: number, indices: number[], tries: number = 5): Promise<Record<number, BetResponse>> {
  const uniqueIndices = Array.from(new Set(indices.map(Number)))

  const [lastLeafIndex] = await fetchLastLeaf(chain)
  const existingLeaves = await leavesDB.getAll(chain)
  const existingIndices = new Set(existingLeaves.map(leaf => leaf.index))

  let allRandomIndices: number[] = []
  for (const index of uniqueIndices) {
    let randomIndices: number[] = []
    while (randomIndices.length < tries) {
      const candidate = Math.floor(Math.random() * (Number(lastLeafIndex) + 1))
      if (!existingIndices.has(candidate) && !randomIndices.includes(candidate)) {
        randomIndices.push(candidate)
      }
      if (existingIndices.size + randomIndices.length >= Number(lastLeafIndex) + 1) break
    }

    /** @dev ensure the requested index is included */
    if (!randomIndices.includes(index)) {
      if (randomIndices.length > 0) {
        const replaceIdx = Math.floor(Math.random() * randomIndices.length)
        randomIndices[replaceIdx] = index
      } else {
        randomIndices.push(index)
      }
    }
    allRandomIndices.push(...randomIndices)
  }

  /** @dev deduplicate indices (batched query) */
  allRandomIndices = Array.from(new Set(allRandomIndices))
  _log('Random indices for all bets:', allRandomIndices)

  const results = await findBets(chain, [], allRandomIndices)
  _log('Results:', results)

  const resultMap: Record<number, BetResponse> = {}
  for (const idx of uniqueIndices) {
    const found = results.find(bet => `${bet?.[0]}` === `${idx}`)
    resultMap[idx] = found || [0, 0n, 0]
  }
  return resultMap
}

export async function findBetSafe(chain: number, index_: number, tries: number = 5) {
  const result = await findBetsSafe(chain, [index_], tries)

  return result[Number(index_)]
}

export async function generateWithdraw({
  chain,
  secretPowerHex,
  manualBetIndex,
  recipientHex,
  relayerHex,
  feeHex,
  refundHex,
  handleStatus,
}: {
  chain: number
  secretPowerHex: string
  manualBetIndex?: number | ''
  recipientHex: string
  relayerHex: string
  feeHex: string
  refundHex: string
  handleStatus?: (msg: string) => void
}) {
  const mimcsponge = await buildMimcSponge()
  const secret_power = hexToBigint(secretPowerHex)
  const secret = secret_power >> 8n
  const power = secret_power & 0x1fn
  const hash = await pedersenHash(leBigintToBuffer(secret, 31))
  const hash_power1 = hash + power + 1n

  const [betIndex, betRand, nextIndex] = await (manualBetIndex ? findBetSafe(chain, manualBetIndex) : findBet(chain, hash_power1))
  _log('Bet found:', {
    betIndex,
    betRand,
    nextIndex,
    hash_power1: bigintToHexRaw(hash_power1),
  })

  if (betIndex > 0 && betRand == 0n) {
    const message = `Bet with hash ${bigintToHexRaw(hash)} is still being processed. Please wait.`
    _warn(message)
    toast(message)
    throw 'bet not processed yet for ' + bigintToHex(hash_power1)
  }
  if (betIndex == 0) {
    toast(`Bet is still being processed. Please wait!`)
    _warn(`Bet with hash ${bigintToHexRaw(hash)} is still processing in the lottery tree.`)
    throw 'Lottery tree is still processing for ' + bigintToHex(hash_power1)
  }

  const bigindex = BigInt(betIndex)

  const dice = await leBufferToBigint(mimcsponge.F.fromMontgomery(mimcsponge.multiHash([secret, betRand, bigindex])))

  const power1 = 10n
  const power2 = 16n
  const power3 = 22n
  const mask =
    power <= power1
      ? ((2n ** (power1 + power2 + power3 + 1n) - 1n) << power) & (2n ** (power1 + power2 + power3 + 1n) - 1n)
      : power <= power2
        ? (((2n ** (power2 + power3 + 1n) - 1n) << (power + power1)) | (2n ** power1 - 1n)) &
          (2n ** (power1 + power2 + power3 + 1n) - 1n)
        : (((2n ** (power3 + 1n) - 1n) << (power + power1 + power2)) | (2n ** (power1 + power2) - 1n)) &
          (2n ** (power1 + power2 + power3 + 1n) - 1n)
  const maskdice = mask & dice
  const rew1 = maskdice & 0b1111111111n ? 0n : 1n
  const rew2 = maskdice & 0b11111111111111110000000000n ? 0n : 1n
  const rew3 = maskdice & 0b111111111111111111111100000000000000000000000000n ? 0n : 1n
  const rewardbits = 4n * rew3 + 2n * rew2 + rew1
  const rewardFoom = BET_MIN * (rew1 * 2n ** power1 + rew2 * 2n ** power2 + rew3 * 2n ** power3)

  const mask1 = (mask & 0b1111111111n).toString(2).padStart(10, '0')
  const mask2 = ((mask & 0b11111111111111110000000000n) >> 10n).toString(2).padStart(16, '0')
  const mask3 = ((mask & 0b111111111111111111111100000000000000000000000000n) >> 26n).toString(2).padStart(22, '0')
  const bits1 = (dice & 0b1111111111n).toString(2).padStart(10, '0')
  const bits2 = ((dice & 0b11111111111111110000000000n) >> 10n).toString(2).padStart(16, '0')
  const bits3 = ((dice & 0b111111111111111111111100000000000000000000000000n) >> 26n).toString(2).padStart(22, '0')

  const rewardFormatted = {
    maskedBits: [maskbits(bits1, mask1), maskbits(bits2, mask2), maskbits(bits3, mask3)],
    reward: formatEther(rewardFoom),
    maskBits: [mask1, mask2, mask3],
    bits: [bits1, bits2, bits3],
  }

  const terces = reverseBits(dice, 31 * 8)
  const nullifierHash = await pedersenHash(leBigintToBuffer(terces, 31))

  const pathElements = await fetchProofPath(chain, betIndex, nextIndex)

  const hexPathElements = pathElements.map(el => `0x${BigInt(`${el}`).toString(16)}`)
  handleStatus?.(`Path elements: ${JSON.stringify(hexPathElements, null, 2)}`)
  _log('Path elements:', hexPathElements)

  const input = {
    root: pathElements[32],
    nullifierHash: nullifierHash,
    rewardbits: rewardbits,
    recipient: hexToBigint(recipientHex),
    relayer: hexToBigint(relayerHex),
    fee: hexToBigint(feeHex),
    refund: hexToBigint(refundHex),
    secret: secret,
    power: power,
    rand: betRand,
    pathIndex: BigInt(betIndex),
    pathElements: pathElements.slice(0, 32),
  }

  handleStatus?.(`Proofing input: ${JSON.stringify({ ...input, secret: '<hidden>' }, null, 2)}`)
  _log('Proofing input:', { ...input, secret: '<hidden>' })

  const { proof } = await groth16.fullProve(
    input,
    'circuit_artifacts/withdraw_js/withdraw.wasm',
    'circuit_artifacts/withdraw_final.zkey'
  )

  handleStatus?.(`Proof: ${JSON.stringify(proof, null, 2)}`)
  _log('Proof:', proof)

  const pA = proof.pi_a.slice(0, 2).map(BigInt) as [bigint, bigint]
  const pB = proof.pi_b.slice(0, 2).map((arr: string[]) => arr.slice(0, 2).map(BigInt) as [bigint, bigint]) as [
    [bigint, bigint],
    [bigint, bigint],
  ]
  const pC = proof.pi_c.slice(0, 2).map(BigInt) as [bigint, bigint]

  const witness = encodeAbiParameters(
    [{ type: 'uint256[2]' }, { type: 'uint256[2][2]' }, { type: 'uint256[2]' }, { type: 'uint256[7]' }],
    [
      pA,
      [
        [pB[0][1], pB[0][0]],
        [pB[1][1], pB[1][0]],
      ],
      pC,
      [
        BigInt(pathElements[32]),
        BigInt(nullifierHash),
        BigInt(rewardbits),
        BigInt(recipientHex),
        BigInt(relayerHex),
        BigInt(feeHex),
        BigInt(refundHex),
      ],
    ]
  )

  _log('Proofed recipient address as:', recipientHex)

  handleStatus?.(`Encoded witness: ${witness}`)
  return {
    encoded: witness,
    reward: rewardFormatted,
    bet: {
      index: betIndex,
      rand: betRand,
    },
    raw: {
      pathElements,
      nullifierHash,
      rewardbits,
      recipientHex,
      relayerHex,
      feeHex,
      refundHex,
      proof: {
        pi_a: pA,
        pi_b: pB,
        pi_c: pC,
      },
    },
  }
}
