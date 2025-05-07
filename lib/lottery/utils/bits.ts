export function maskbits(bits: string, mask: string): string {
  let bitstr = ''
  for (let i = 0; i < bits.length; i++) {
    bitstr += mask.charAt(i) === '1' ? bits.charAt(i) : 'ˍˍ'
  }
  return bitstr
}
