/** @dev 1 million FOOM, ~$0.10 */
export const BET_MIN = 1_000_000n * 10n ** 18n

/** @dev 2 million FOOM, ~$0.20 */
export const BET_PADDING = 2_000_000n * 10n ** 18n

/** @dev 10 million FOOM, ~$1.00; NOTE: this is always deducted from min jackpot which is ~$100.00 */
export const FEE_MIN = 10_000_000n * 10n ** 18n

/** @dev 0.001 ETH, ~$2.50 */
export const REFUND_MAX = 1_000_000_000_000_000n // 0.001 * 10n ** 18n

/** @dev 0.0001 ETH, ~$0.25 */
export const REFUND_CUSTOM = 100_000_000_000_000n // 0.0001 * 10n ** 18n
