import { formatUsd } from '@/lib/utils'

export function formatDate(dateStr: string) {
  if (!dateStr || dateStr === '-') return 'Long time ago'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatTimeAgo(dateStr: string) {
  if (!dateStr || dateStr === '-') return 'Long time ago'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) {
    const min = Math.floor(diff / 60)
    return `${min} minute${min !== 1 ? 's' : ''} ago`
  }
  if (diff < 86400) {
    const hr = Math.floor(diff / 3600)
    return `${hr} hour${hr !== 1 ? 's' : ''} ago`
  }
  const days = Math.floor(diff / 86400)
  return `${days} day${days !== 1 ? 's' : ''} ago`
}

export function getTicketPrice(power: number, foomPrice?: number, raw?: boolean) {
  try {
    const base = Number(2n + 2n ** BigInt(power))
    const price = foomPrice !== undefined ? base * foomPrice * 1e6 : base / 10

    return raw ? price : formatUsd(price)
  } catch {
    return '-'
  }
}

export function maskSecret(secret: string | null, customBounds: { start?: number; end?: number } = {}) {
  if (!secret || typeof secret !== 'string') {
    return ''
  }

  const s = secret.startsWith('0x') ? secret.slice(2) : secret
  if (s.length <= 12) {
    return secret
  }

  return `${secret.slice(0, customBounds.start ?? 8)}...${secret.slice(customBounds.end ? -customBounds.end : -4)}`
}
