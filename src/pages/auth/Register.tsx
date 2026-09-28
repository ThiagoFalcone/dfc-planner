import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { AuthLayout } from './AuthLayout'

export function RegisterPage() {
  const { cadastrar } = useAuth()
  const navigate = useNavigate()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  function validar(): string | null {
    if (nome.trim().length < 2) return 'Informe seu nome.'
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'Informe um e-mail válido.'
    if (senha.length < 6) return 'A senha deve ter pelo menos 6 caracteres.'
    if (senha !== confirmarSenha) return 'As senhas não coincidem.'
    return null
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const problema = validar()
    if (problema) {
      setErro(problema)
      return
    }
    setErro(null)
    setCarregando(true)
    try {
      await cadastrar({ nome, email, senha, empresa: empresa || undefined })
      navigate('/app', { replace: true })
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível criar a conta.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <AuthLayout
      title="Criar conta"
      subtitle="Seu planejamento fica salvo com segurança no servidor."
      footer={
        <>
          Já tem conta?{' '}
          <Link to="/login" className="focus-ring rounded font-medium text-accent hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {erro && <Alert tone="danger">{erro}</Alert>}

        <TextField
          label="Nome"
          autoComplete="name"
          placeholder="Seu nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
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
          label="Empresa / projeto (opcional)"
          placeholder="Ex.: Grupo 3, Engenharia Econômica"
          value={empresa}
          onChange={(e) => setEmpresa(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Senha"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
          <TextField
            label="Confirmar senha"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            required
          />
        </div>

        <Button type="submit" variant="primary" size="lg" loading={carregando} className="mt-1 w-full">
          Criar conta
        </Button>

        <p className="text-center text-xs leading-relaxed text-fg-3">
          Sua senha é criptografada e armazenada com segurança no servidor, nunca em texto simples.
        </p>
      </form>
    </AuthLayout>
  )
}
