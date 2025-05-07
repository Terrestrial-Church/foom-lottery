const preserveNumber = (num: number | string) => (typeof num === 'string' ? num : num.toFixed(10))

export { preserveNumber }

export function formatNumber(number, showDecimals = true) {
  if (typeof number !== 'number' || isNaN(number)) return '—'
  const formatted = number.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return showDecimals ? formatted : formatted.slice(0, -3)
}
