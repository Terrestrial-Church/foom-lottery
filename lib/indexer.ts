import { isLocal } from '@/lib/utils/environment'
import { _log } from '@/lib/utils/ts'
import axios from 'axios'

const createIndexer = (version: 'v1' | 'v1-eth') => {
  const isLocalEth = isLocal() && version === 'v1-eth'

  const baseApi = isLocalEth ? process.env.NEXT_PUBLIC_INDEXER_API_LOCAL_ETH! : process.env.NEXT_PUBLIC_INDEXER_API!
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
const indexer = Object.assign(createIndexer('v1'), {
  base: createIndexer('v1'),
  eth: createIndexer('v1-eth'),
})

export default indexer
