/**
 * Get currency symbol from currency code
 */
export const getCurrencySymbol = (currencyCode: string): string => {
  const currencySymbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    MXN: '$',
    CAD: 'C$',
    AUD: 'A$',
    BRL: 'R$',
    CNY: '¥',
    INR: '₹',
    KRW: '₩',
    RUB: '₽',
    CHF: 'CHF',
    ARS: '$',
    CLP: '$',
    COP: '$',
    PEN: 'S/',
  }

  return currencySymbols[currencyCode] || currencyCode
}

/**
 * Format amount with currency symbol
 */
export const formatCurrency = (
  amount: number,
  currencyCode: string,
  options: Intl.NumberFormatOptions = {}
): string => {
  try {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currencyCode,
      ...options,
    }).format(amount)
  } catch {
    const symbol = getCurrencySymbol(currencyCode)
    return `${symbol}${amount.toLocaleString('es-MX')}`
  }
}
