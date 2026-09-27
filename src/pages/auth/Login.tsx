import { type FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { TextField } from '@/components/ui/TextField'
import { AuthLayout } from './AuthLayout'

export function LoginPage() {
  const { entrar } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [manterConectado, setManterConectado] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [ajudaSenha, setAjudaSenha] = useState(false)

  const destino = (location.state as { from?: string } | null)?.from ?? '/app'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim() || !senha) {
      setErro('Informe e-mail e senha.')
      return
    }
    setErro(null)
    setCarregando(true)
    try {
      await entrar({ email, senha, manterConectado })
      navigate(destino, { replace: true })
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível entrar.')
      setCarregando(false)
    }
  }

  return (
    <AuthLayout
      title="DFC Planner"
      subtitle="Planejamento financeiro inteligente"
      footer={
        <>
          Ainda não tem conta?{' '}
          <Link to="/registrar" className="focus-ring rounded font-medium text-accent hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {erro && <Alert tone="danger">{erro}</Alert>}

        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          placeholder="voce@empresa.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
        <TextField
          label="Senha"
          type="password"
          autoComplete="current-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          labelAction={
            <button
              type="button"
              onClick={() => setAjudaSenha(true)}
              className="focus-ring rounded text-xs text-fg-3 hover:text-fg-2"
            >
              Esqueci minha senha
            </button>
          }
        />

        <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-fg-2 select-none">
          <input
            type="checkbox"
            checked={manterConectado}
            onChange={(e) => setManterConectado(e.target.checked)}
            className="h-4 w-4 rounded accent-fg"
          />
          Manter conectado
        </label>

        <Button type="submit" variant="primary" size="lg" loading={carregando} className="mt-1 w-full">
          Entrar
        </Button>
      </form>

      <Modal
        aberto={ajudaSenha}
        onFechar={() => setAjudaSenha(false)}
        titulo="Recuperação de senha"
        descricao="Recuperar senha depende de um servidor que envie o link por e-mail, e esta versão demonstrativa não tem um. Crie uma nova conta neste navegador."
        rodape={
          <Button size="sm" variant="primary" onClick={() => setAjudaSenha(false)}>
            Entendi
          </Button>
        }
      />
    </AuthLayout>
  )
}
