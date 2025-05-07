import { buildPedersenHash } from 'circomlibjs'

import { leBufferToBigint } from './bigint'

/**
 * Usage:
 *    const ticketSecret = BigInt(redeemHex)
 *    const power = ticketSecret & 0xffn
 *    const secret = ticketSecret >> 8n
 *    const ticketHash = await pedersenHash(leBigintToBuffer(secret, 31))
 */
const pedersenHash = async (data: Uint8Array) => {
  const pedersen = await buildPedersenHash()

  const pedersenOutput = pedersen.hash(data)

  const babyJubOutput = leBufferToBigint(
    pedersen.babyJub.F.fromMontgomery(pedersen.babyJub.unpackPoint(pedersenOutput)[0])
  )
  return babyJubOutput
}

export { pedersenHash }
