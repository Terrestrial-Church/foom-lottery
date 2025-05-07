import { buildMimcSponge } from 'circomlibjs'
import { formatEther } from 'viem/utils'
import { hexToBigint, leBigintToBuffer, leBufferToBigint } from '@/lib/lottery/utils/bigint'
import { pedersenHash } from '@/lib/lottery/utils/pedersen'
import { maskbits } from '@/lib/lottery/utils/bits'
import { BET_MIN } from '@/lib/lottery/constants'
import type { LeafEntry } from '@/lib/db/leavesDb'
import { _log } from '@/lib/utils/ts'

self.onmessage = async function (
  event: MessageEvent<{
    ticket: Pick<LeafEntry, 'secret' | 'power' | 'index' | 'rand'>
  }>
) {
  const { secret, power, index, rand } = event.data.ticket
  const betIndex = index || 0
  const betRand = rand ? BigInt(rand) : 0n

  try {
    const secretBigInt = hexToBigint(secret)
    const powerBigInt = BigInt(power)
    const secret_power = (secretBigInt << 8n) + powerBigInt

    const mimcsponge = await buildMimcSponge()
    const hash = await pedersenHash(leBigintToBuffer(secretBigInt, 31))
    const hash_power1 = hash + powerBigInt + 1n

    if (betIndex > 0 && betRand == 0n) {
      _log('[Worker] Skipping: betIndex > 0 && betRand == 0n', { betIndex, betRand })
      self.postMessage(undefined)
      return
    }
    if (betIndex == 0) {
      _log('[Worker] Skipping: betIndex == 0', { betIndex, betRand })
      self.postMessage(undefined)
      return
    }

    const bigindex = BigInt(betIndex)
    const dice = leBufferToBigint(mimcsponge.F.fromMontgomery(mimcsponge.multiHash([secretBigInt, betRand, bigindex])))

    const power1 = 10n
    const power2 = 16n
    const power3 = 22n
    const mask =
      powerBigInt <= power1
        ? ((2n ** (power1 + power2 + power3 + 1n) - 1n) << powerBigInt) & (2n ** (power1 + power2 + power3 + 1n) - 1n)
        : powerBigInt <= power2
          ? (((2n ** (power2 + power3 + 1n) - 1n) << (powerBigInt + power1)) | (2n ** power1 - 1n)) &
            (2n ** (power1 + power2 + power3 + 1n) - 1n)
          : (((2n ** (power3 + 1n) - 1n) << (powerBigInt + power1 + power2)) | (2n ** (power1 + power2) - 1n)) &
            (2n ** (power1 + power2 + power3 + 1n) - 1n)
    const maskdice = mask & dice
    const rew1 = maskdice & 0b1111111111n ? 0n : 1n
    const rew2 = maskdice & 0b11111111111111110000000000n ? 0n : 1n
    const rew3 = maskdice & 0b111111111111111111111100000000000000000000000000n ? 0n : 1n
    const reward = BET_MIN * (rew1 * 2n ** power1 + rew2 * 2n ** power2 + rew3 * 2n ** power3)

    const mask1 = (mask & 0b1111111111n).toString(2).padStart(10, '0')
    const mask2 = ((mask & 0b11111111111111110000000000n) >> 10n).toString(2).padStart(16, '0')
    const mask3 = ((mask & 0b111111111111111111111100000000000000000000000000n) >> 26n).toString(2).padStart(22, '0')
    const bits1 = (dice & 0b1111111111n).toString(2).padStart(10, '0')
    const bits2 = ((dice & 0b11111111111111110000000000n) >> 10n).toString(2).padStart(16, '0')
    const bits3 = ((dice & 0b111111111111111111111100000000000000000000000000n) >> 26n).toString(2).padStart(22, '0')

    self.postMessage({
      secret,
      power,
      index: betIndex,
      rand: rand,
      maskedBits: [maskbits(bits1, mask1), maskbits(bits2, mask2), maskbits(bits3, mask3)],
      reward: formatEther(reward),
      maskBits: [mask1, mask2, mask3],
      bits: [bits1, bits2, bits3],
    })
  } catch (err) {
    console.error('[Worker] Error:', err)
    self.postMessage(undefined)
  }
}
