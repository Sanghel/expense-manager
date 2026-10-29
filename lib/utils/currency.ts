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
