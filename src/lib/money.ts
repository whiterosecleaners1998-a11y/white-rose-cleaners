/**
 * Amounts arrive from Prisma as Decimals and leave as JS numbers, which drift:
 * 935 - 500.1 lands on 434.89999999999998 and prints as a stray paisa. Every
 * derived figure goes through here so the arithmetic stays in whole paisa.
 */
export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * What is still owed. Clamped at zero: an overpayment is a rounding slip or a
 * tip, and neither should show up as a negative balance on a receipt.
 */
export function balanceOf(totalAmount: number, paidAmount: number): number {
  return roundMoney(Math.max(0, totalAmount - paidAmount));
}
