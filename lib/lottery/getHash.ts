import { pedersenHash } from './utils/pedersen'
import { rbigint, bigintToHex, leBigintToBuffer, hexToBigint } from './utils/bigint'
import { _log } from '@/lib/utils/ts'

export async function getHash(inputs: (string | number | any)[]) {
  let power = hexToBigint(inputs[0])
  let hash = 0n
  let secret = 0n
  let i = 0n
  let secret_power = 0n
  let ticket = 0n
  if (power >= 0x1fn) {
    secret_power = power
    hash = await pedersenHash(leBigintToBuffer(secret_power >> 8n, 31))
  } else {
    for (; i < 10000n; i++) {
      secret = rbigint(31)
      hash = await pedersenHash(leBigintToBuffer(secret, 31))
      if ((hash & 0x1fn) == 0n) {
        ticket = i
        break
      }
    }
    if (ticket >= 10000n) {
      throw new Error('Failed to create ticket')
    }
    secret_power = (secret << 8n) | power
  }

  // const res = ethers.AbiCoder.defaultAbiCoder().encode(
  //   ["uint", "uint", "uint", "uint"],
  //   [bigintToHex(secret_power), bigintToHex(hash), bigintToHex(nextIndex),bigintToHex(blockNumber)]
  // );
  // return res;

  return {
    secret_power: bigintToHex(secret_power),
    hash: bigintToHex(hash),
  }
}

/**
 * Generates a valid secret and hash for a ticket, where the hash & 0x1f == 0.
 * Returns { secret, hash } as bigints.
 */
export async function makeSecret() {
  let secret = 0n
  let hash = 0n
  for (let i = 0n; i < 10000n; i++) {
    secret = rbigint(31)
    hash = await pedersenHash(leBigintToBuffer(secret, 31))
    if ((hash & 0x1fn) === 0n) {
      return { secret, hash }
    }
  }
  throw new Error('Failed to create ticket')
}

/**
 * Combines a given secret and power into secret_power, and computes the hash.
 * Returns { secret_power, hash } as hex strings.
 */
export async function getSecretPower(secret: bigint, power: bigint) {
  let secret_power = (secret << 8n) | power
  let hash = await pedersenHash(leBigintToBuffer(secret, 31))

  _log('returning', {
    secret_power: bigintToHex(secret_power),
    hash: bigintToHex(hash),
  })
  return {
    secret_power: bigintToHex(secret_power),
    hash: bigintToHex(hash),
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  getHash(process.argv.slice(2))
    .then(res => {
      process.stdout.write(JSON.stringify(res))
      process.exit(0)
    })
    .catch(err => {
      console.error(err)
      process.exit(1)
    })
}
