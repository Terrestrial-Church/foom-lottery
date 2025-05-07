import { AppKitProvider } from '@/providers/app-kit'
import { LotteryProvider } from '@/providers/LotteryProvider'
import { type ReactNode } from 'react'

export const Providers = ({ children, cookies }: { children: ReactNode; cookies: string | null }) => (
  <AppKitProvider {...{ cookies }}>
    <LotteryProvider>{children}</LotteryProvider>
  </AppKitProvider>
)
