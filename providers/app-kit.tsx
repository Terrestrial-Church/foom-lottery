import { createAppKit, Metadata } from '@reown/appkit/react'
import { cookieToInitialState, WagmiProvider, Config } from 'wagmi'
import { AppKitNetwork } from '@reown/appkit/networks'
import { mainnet, base, sepolia, baseSepolia, foundry } from 'viem/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { cookieStorage, createStorage, http } from '@wagmi/core'
import { WC_ID } from '@/lib/utils/constants'
import { _log } from '@/lib/utils/ts'
import { chains } from '@/lib/utils/constants/addresses'

const queryClient = new QueryClient()

const projectId = WC_ID
const networks = chains as unknown as [AppKitNetwork, ...AppKitNetwork[]]

const metadata: Metadata = {
  name: 'FOOM.Cash',
  description: 'FOOM.Cash Lottery – Possibly The Most Fair Lottery in the World. Trustless and completely anonymous.',
  url: 'https://foom.cash',
  icons: ['https://foom.cash/icon.svg'],
}

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }) as any,
  ssr: true,
  projectId,
  networks,
})

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  defaultNetwork: networks[0],
  projectId,
  metadata,
  enableWallets: true,
  enableWalletGuide: true,
  allWallets: 'ONLY_MOBILE',
  features: {
    analytics: true,
    socials: [],
    email: false,
  },
  enableWalletConnect: true,
  showWallets: true,
  themeMode: 'dark',
  themeVariables: {
    /* @ts-ignore */
    '--w3m-background-color': '#101840',
    '--w3m-accent-color': '#101840',
    /* @ts-ignore */
    '--w3m-color-bg-1': '#000000',
    /* @ts-ignore */
    '--w3m-color-bg-2': '#000000',
    /* @ts-ignore */
    '--w3m-color-bg-3': '#000000',
    /* @ts-ignore */
    '--w3m-color-fg-1': '#101828',
    /* @ts-ignore */
    '--w3m-color-fg-2': '#eaac76',
    /* @ts-ignore */
    '--w3m-color-fg-3': '#101828',
    /* @ts-ignore */
    '--w3m-z-index': 1400 /** @dev ChakraUI Modal */,
    '--w3m-overlay-backdrop-filter': 'blur(10px)',
    /* @ts-ignore */
    '--w3m-overlay-background-color': '#0000000f',
    '--w3m-background-border-radius': '16px',
    '--w3m-button-border-radius': '16px',
    '--w3m-border-radius-master': '16px',
    '--w3m-accent': '#64d3d3',
    '--w3m-font-family': 'PixeloidSansNoBold',
    '--w3m-font-weight': '400 !important',
    '--wui-font-weight': '400 !important',
    '--w3m-color-mix': '#121212',
    '--w3m-color-mix-strength': 0,

    '--wui-color-modal-bg-base': 'yellow !important',
    '--wui-color-modal-bg-base-contrast': 'yellow !important',
    '--wui-cover': 'yellow !important',
  },
})

export function AppKitProvider({ children, cookies }: { children: React.ReactNode; cookies: string | null }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  return (
    <WagmiProvider
      config={wagmiAdapter.wagmiConfig as Config}
      initialState={initialState}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
