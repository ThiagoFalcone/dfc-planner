import type { SVGProps } from 'react'

/** Ícones de traço 1.6px, grade 24. Um só estilo em todo o produto. */
const PATHS = {
  planejamento: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17M9 9.5V19.5M14.5 9.5V19.5" />
    </>
  ),
  resultados: <path d="M4 19.5h16M7 16v-4M12 16V7M17 16v-6" />,
  cenarios: <path d="M3.5 17c3-1 4.5-9 8.5-9s5.5 5 8.5 4M3.5 12c3 0 4.5-4 8.5-4M12 8c4 0 5.5 8 8.5 9" />,
  auditoria: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  busca: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </>
  ),
  sol: (
    <>
      <circle cx="12" cy="12" r="3.8" />
      <path d="M12 3v1.8M12 19.2V21M3 12h1.8M19.2 12H21M5.6 5.6l1.3 1.3M17.1 17.1l1.3 1.3M5.6 18.4l1.3-1.3M17.1 6.9l1.3-1.3" />
    </>
  ),
  lua: <path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10Z" />,
  monitor: (
    <>
      <rect x="3.5" y="4.5" width="17" height="11.5" rx="1.5" />
      <path d="M9 20h6M12 16v4" />
    </>
  ),
  sino: <path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 1.5h-15L6 16.5ZM10 20.5a2 2 0 0 0 4 0" />,
  usuario: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 19.5c1.2-3.3 3.8-5 7-5s5.8 1.7 7 5" />
    </>
  ),
  ajustes: <path d="M4 7h10M18 7h2M4 17h2M10 17h10M16 4.5v5M8 14.5v5" />,
  sair: <path d="M14 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H14M10 12h10M17 9l3 3-3 3" />,
  download: <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M4.5 19.5h15" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  mais: <path d="M12 5v14M5 12h14" />,
  lixeira: <path d="M5 7h14M10 7V5h4v2M7 7l.8 12h8.4L17 7" />,
  seta: <path d="M5 12h14M13 6l6 6-6 6" />,
  chevron: <path d="m7 10 5 5 5-5" />,
  alerta: <path d="M12 4 3 19.5h18L12 4ZM12 10v4.5M12 17.2v.3" />,
  info: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 11v5M12 8v.3" />
    </>
  ),
  sobe: <path d="m6 14 6-6 6 6" />,
  desce: <path d="m6 10 6 6 6-6" />,
  arquivo: <path d="M7 3.5h7l4 4v13H7v-17ZM14 3.5v4h4" />,
  relogio: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4h3.5" />
    </>
  ),
  escudo: <path d="M12 3.5 5 6v5.5c0 4.3 3 7.6 7 9 4-1.4 7-4.7 7-9V6l-7-2.5Z" />,
  camadas: <path d="m12 4 8.5 4.5L12 13 3.5 8.5 12 4ZM3.5 12.5 12 17l8.5-4.5M3.5 16.5 12 21l8.5-4.5" />,
  voltar: <path d="M9 7 4 12l5 5M4 12h11a5 5 0 0 1 0 10h-1" />,
  lapis: <path d="M4.5 19.5 5.5 15 15.5 5a2 2 0 0 1 3 3l-10 10-4 1.5Z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  sensibilidade: (
    <>
      <path d="M5 4v16M12 4v16M19 4v16" />
      <circle cx="5" cy="14" r="2" fill="var(--surface)" />
      <circle cx="12" cy="8" r="2" fill="var(--surface)" />
      <circle cx="19" cy="16" r="2" fill="var(--surface)" />
    </>
  ),
  refazer: <path d="M15 7l5 5-5 5M20 12H9a5 5 0 0 0 0 10h1" />,
  copiar: (
    <>
      <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
      <path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" />
    </>
  ),
  upload: <path d="M12 16V5M7.5 9.5 12 5l4.5 4.5M4.5 19.5h15" />,
  pasta: <path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-10Z" />,
  teclado: (
    <>
      <rect x="3" y="6.5" width="18" height="11" rx="2" />
      <path d="M7 10h.01M10.5 10h.01M14 10h.01M17.5 10h.01M8 14h8" />
    </>
  ),
  impressora: <path d="M7 9V4h10v5M7 17H5a1.5 1.5 0 0 1-1.5-1.5v-5A1.5 1.5 0 0 1 5 9h14a1.5 1.5 0 0 1 1.5 1.5v5A1.5 1.5 0 0 1 19 17h-2M7 14h10v6H7z" />,
} as const

export type NomeIcone = keyof typeof PATHS

export function Icon({ nome, className, ...props }: { nome: NomeIcone } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className ?? 'h-[18px] w-[18px]'}
      {...props}
    >
      {PATHS[nome]}
    </svg>
  )
}

/**
 * Marca do DFC Planner: uma curva de acumulado que desce abaixo da linha zero
 * e se recupera: o conceito central do produto.
 */
export function BrandMark({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect x="0.5" y="0.5" width="31" height="31" rx="9" fill="var(--text-primary)" />
      <path d="M6 15.5h20" stroke="var(--surface)" strokeOpacity="0.35" strokeWidth="1.4" strokeLinecap="round" />
      <path
        d="M6 12.5c2.6 0 3.6 8.5 7.4 8.5 3.4 0 4.2-9.5 12.6-12"
        fill="none"
        stroke="var(--surface)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="13.4" cy="21" r="2.1" fill="var(--negative)" />
    </svg>
  )
}
