import { isRemote } from '@/lib/utils/environment'
import { _log } from '@/lib/utils/ts'
import { zeroAddress, type Address } from 'viem'
import { base, baseSepolia, type Chain, foundry, mainnet } from 'viem/chains'

const LOTTERY: { [key: Chain['id']]: Address } = {
  [foundry.id]: '0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0',
  [base.id]: '0xdb203504ba1fea79164AF3CeFFBA88C59Ee8aAfD',
  [mainnet.id]: '0x239AF915abcD0a5DCB8566e863088423831951f8',
}

const FOOM: { [key: Chain['id']]: Address } = {
  [foundry.id]: '0x610178dA211FEF7D417bC0e6FeD39F05609AD788',
  [base.id]: '0x02300aC24838570012027E0A90D3FEcCEF3c51d2',
  [mainnet.id]: '0xd0D56273290D339aaF1417D9bfa1bb8cFe8A0933',
}

const AIRDROP1_TOKEN: { [key: Chain['id']]: Address } = {
  [foundry.id]: zeroAddress,
  [baseSepolia.id]: zeroAddress /** TODO: */,
  [base.id]: '0x5fcC57700974Dc4f1017b34696E6B3db99434D65',
  [mainnet.id]: '0x4EC3b7080a22723760E278D48197866416dd34BD',
}

const AIDROP1_CONTRACT: { [key: Chain['id']]: Address } = {
  [foundry.id]: zeroAddress,
  [baseSepolia.id]: zeroAddress /** TODO: */,
  [base.id]: '0xC85E9D6EA262443057621141FF9C2A147C69eC38',
  [mainnet.id]: '0xA4890e1b322348b87BE95a96fE372F4f316E30Ac',
}

/** @deprecated */
const chain = isRemote() ? base : foundry

const chains = [mainnet, base]

export { LOTTERY, FOOM, chain, chains, AIRDROP1_TOKEN, AIDROP1_CONTRACT }
