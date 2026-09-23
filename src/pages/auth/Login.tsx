import { type FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { AuthLayout } from './AuthLayout'

export function LoginPage() {
  const { entrar } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  const destino = (location.state as { from?: string } | null)?.from ?? '/app'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setCarregando(true)
    try {
      await entrar({ email, senha })
      navigate(destino, { replace: true })
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível entrar.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <AuthLayout
      title="Entrar"
      subtitle="Acesse seus cenários de fluxo de caixa."
      footer={
        <>
          Ainda não tem conta?{' '}
          <Link to="/registrar" className="font-medium text-brand-600 hover:text-brand-700">
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
        />
        <TextField
          label="Senha"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />

        <Button type="submit" size="lg" loading={carregando} className="mt-1 w-full">
          Entrar
        </Button>

        <button
          type="button"
          onClick={() => {
            setEmail('demo@dfcplanner.app')
            setSenha('demo1234')
          }}
          className="text-center text-xs text-ink-400 hover:text-ink-600"
        >
          Preencher com conta de demonstração
        </button>
      </form>
    </AuthLayout>
  )
}
