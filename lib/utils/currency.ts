export function formatCurrency(amount: number, currency: string, fractionDigits = 2): string {
  // VES (bolívar venezolano) uses 'Bs' as symbol; Intl support varies by browser
  if (currency === 'VES') {
    return `Bs ${new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(amount)}`
  }

  // COP: use 'COP' prefix instead of the locale '$' symbol
  if (currency === 'COP') {
    return `COP ${new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(amount)}`
  }

  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toLocaleString('es-CO', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })}`
  }
}

/**
 * Short form for tight spots: "COP 8,68M", "COP 254.500", "US$ 1.250,00".
 * Millions collapse to two decimals; smaller amounts use `formatCurrency`.
 */
export function formatCompactCurrency(amount: number, currency: string): string {
  if (Math.abs(amount) < 1_000_000) {
    return formatCurrency(amount, currency, currency === 'COP' ? 0 : 2)
  }
  const millions = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount / 1_000_000)
  const symbol = currency === 'VES' ? 'Bs' : currency === 'USD' ? 'US$' : currency
  return `${symbol} ${millions}M`
}
