import { isLocal } from '@/lib/utils/environment'
import axios from 'axios'

const createRelayer = (version: 'v1' | 'v1-eth' = 'v1') => {
  const isLocalEth = isLocal() && version === 'v1-eth'

  const baseApi = isLocalEth ? process.env.NEXT_PUBLIC_RELAYER_API_LOCAL_ETH! : process.env.NEXT_PUBLIC_RELAYER_API!
  const baseURL = baseApi.replace(/\/v1(-eth)?$/, `/${version}`)

  const instance = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  instance.interceptors.request.use(
    config => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('jwt-appkit')
        if (token) {
          config.headers.authorization = token
        }
      }
      return config
    },
    error => {
      return Promise.reject(error)
    }
  )

  return instance
}

/** @dev uses `/v1` as default */
const relayer = Object.assign(createRelayer('v1'), {
  base: createRelayer('v1'),
  eth: createRelayer('v1-eth'),
})

export default relayer
