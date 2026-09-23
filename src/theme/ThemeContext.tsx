import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { CHAVES, gravarJSON, lerJSON } from '@/services/storage/localStore'

export type PreferenciaTema = 'light' | 'dark' | 'system'
export type TemaEfetivo = 'light' | 'dark'

interface ThemeContextValue {
  preferencia: PreferenciaTema
  tema: TemaEfetivo
  definirPreferencia(p: PreferenciaTema): void
  alternar(): void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function ehPreferencia(v: unknown): v is PreferenciaTema {
  return v === 'light' || v === 'dark' || v === 'system'
}

const consultaEscuro = () => window.matchMedia('(prefers-color-scheme: dark)')

function resolver(p: PreferenciaTema, sistemaEscuro: boolean): TemaEfetivo {
  return p === 'system' ? (sistemaEscuro ? 'dark' : 'light') : p
}

// O atributo é aplicado antes do setState para que componentes que leem
// tokens via getComputedStyle (gráficos) já vejam o tema novo no re-render.
function aplicar(tema: TemaEfetivo) {
  document.documentElement.setAttribute('data-theme', tema)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preferencia, setPreferencia] = useState<PreferenciaTema>(
    () => lerJSON(CHAVES.tema, ehPreferencia) ?? 'system',
  )
  const [sistemaEscuro, setSistemaEscuro] = useState(() => consultaEscuro().matches)
  const tema = resolver(preferencia, sistemaEscuro)

  useEffect(() => {
    const mq = consultaEscuro()
    const onChange = (e: MediaQueryListEvent) => {
      if (preferencia === 'system') aplicar(e.matches ? 'dark' : 'light')
      setSistemaEscuro(e.matches)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [preferencia])

  useEffect(() => {
    aplicar(tema)
  }, [tema])

  const definirPreferencia = useCallback(
    (p: PreferenciaTema) => {
      aplicar(resolver(p, sistemaEscuro))
      setPreferencia(p)
      gravarJSON(CHAVES.tema, p)
    },
    [sistemaEscuro],
  )

  const alternar = useCallback(() => {
    definirPreferencia(tema === 'dark' ? 'light' : 'dark')
  }, [tema, definirPreferencia])

  const value = useMemo(
    () => ({ preferencia, tema, definirPreferencia, alternar }),
    [preferencia, tema, definirPreferencia, alternar],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme deve ser usado dentro de <ThemeProvider>.')
  return ctx
}
