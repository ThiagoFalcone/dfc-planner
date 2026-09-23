const formatadorMoeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const formatadorMoedaInteira = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const formatadorNumero = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatarMoeda(valor: number): string {
  return formatadorMoeda.format(valor)
}

/** Sem centavos quando o valor é inteiro — para KPIs e rótulos de gráfico. */
export function formatarMoedaCurta(valor: number): string {
  return Number.isInteger(valor) ? formatadorMoedaInteira.format(valor) : formatadorMoeda.format(valor)
}

/** Número em formato brasileiro sem símbolo, para células da planilha. */
export function formatarNumero(valor: number): string {
  return formatadorNumero.format(valor)
}

export function formatarMoedaCompacta(valor: number): string {
  const abs = Math.abs(valor)
  const sinal = valor < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sinal}R$ ${(abs / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`
  if (abs >= 1_000) return `${sinal}R$ ${(abs / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`
  return formatarMoedaCurta(valor)
}

export function rotuloMes(mes: number): string {
  return `Mês ${mes}`
}

/**
 * Converte o que a pessoa digitou numa célula para a forma canônica aceita
 * por paraNumero ("6000.5"). Aceita "6.000", "6.000,50", "6000,5", "R$ 6.000".
 * Se o texto não for reconhecido, devolve-o aparado — a validação de
 * calculos.ts sinaliza o campo em vez de corrigi-lo em silêncio.
 */
export function normalizarEntradaMonetaria(texto: string): string {
  const limpo = texto.replace(/R\$|\s/g, '').trim()
  if (limpo === '') return ''
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(limpo)) {
    return limpo.replace(/\./g, '').replace(',', '.')
  }
  if (/^-?\d+(,\d+)?$/.test(limpo)) return limpo.replace(',', '.')
  if (/^-?\d+(\.\d+)?$/.test(limpo)) return limpo
  return texto.trim()
}

const formatadorDataHora = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const formatadorHora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })
const formatadorDia = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

export function formatarDataHora(iso: string): string {
  return formatadorDataHora.format(new Date(iso))
}

export function formatarHora(iso: string): string {
  return formatadorHora.format(new Date(iso))
}

export function formatarDia(iso: string): string {
  return formatadorDia.format(new Date(iso))
}

/** "agora", "há 3 min", "há 2 h", "ontem", "12/09/2026". */
export function tempoRelativo(iso: string, agora = new Date()): string {
  const segundos = Math.round((agora.getTime() - new Date(iso).getTime()) / 1000)
  if (segundos < 45) return 'agora'
  const minutos = Math.round(segundos / 60)
  if (minutos < 60) return `há ${minutos} min`
  const horas = Math.round(minutos / 60)
  if (horas < 24) return `há ${horas} h`
  const dias = Math.round(horas / 24)
  if (dias === 1) return 'ontem'
  if (dias < 7) return `há ${dias} dias`
  return formatarDia(iso)
}
