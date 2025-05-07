/**
 * Calculates the annual percentage yield based on the number of bets and shares.
 *
 * @param bets number of bets placed in the lottery
 * @param shares number of shares in the lottery pool
 * @returns calculated APY as a decimal (e.g., 0.05 for 5%)
 */
const getApy = (bets: number, shares: number) =>
  (1.0 + (0.04 * bets) / shares) ** ((60 * 60 * 24 * 365) / (16384 * 2)) - 1
