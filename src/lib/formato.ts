const formatadorMoeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatarMoeda(valor: number): string {
  return formatadorMoeda.format(valor)
}

export function formatarMoedaCompacta(valor: number): string {
  const abs = Math.abs(valor)
  if (abs >= 1_000_000) return `${valor < 0 ? '-' : ''}R$ ${(abs / 1_000_000).toFixed(1)}mi`
  if (abs >= 1_000) return `${valor < 0 ? '-' : ''}R$ ${(abs / 1_000).toFixed(1)}mil`
  return formatarMoeda(valor)
}

export function rotuloMes(mes: number): string {
  return mes === 0 ? 'Mês 0' : `Mês ${mes}`
}
