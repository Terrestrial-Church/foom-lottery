export interface WitnessType {
  encoded: `0x${string}`
  raw: {
    pathElements: bigint[]
    nullifierHash: bigint
    rewardbits: bigint
    recipientHex: string
    relayerHex: string
    feeHex: string
    refundHex: string
    proof: {
      pi_a: any[]
      pi_b: any[]
      pi_c: any[]
    }
  }
}

export interface RewardType {
  maskedBits: string[]
  reward: string
  maskBits: string[]
  bits: string[]
}

export type RelayerType = 'main' | 'secondary'

export interface MutationResult {
  hash: `0x${string}`
}

export interface CollectMutationType {
  mutate: (params?: any) => void
  isPending: boolean
}
