'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Leaf, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [modo, setModo] = useState<'login' | 'cadastro'>('login')
  const [mensagem, setMensagem] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setMensagem('')
    setLoading(true)

    if (modo === 'cadastro') {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: senha }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao criar conta.')
        setLoading(false)
        return
      }
      const result = await signIn('credentials', { email, password: senha, redirect: false })
      if (result?.error) {
        setErro('Conta criada! Faça login para continuar.')
        setModo('login')
      } else {
        router.push('/')
        router.refresh()
      }
    } else {
      const result = await signIn('credentials', { email, password: senha, redirect: false })
      if (result?.error) {
        setErro('E-mail ou senha incorretos.')
      } else {
        router.push('/')
        router.refresh()
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-col justify-between w-2/5 bg-[#1B3A2F] px-12 py-16">
        <div className="flex items-center gap-3">
          <div className="bg-[#5A9E7C] rounded-xl p-2">
            <Leaf className="w-5 h-5 text-white" strokeWidth={1.5} />
          </div>
          <span className="text-white font-semibold text-lg tracking-wide">Psico Agenda</span>
        </div>

        <div>
          <blockquote className="text-[#A8D5BC] text-2xl font-light leading-relaxed mb-6" style={{ fontFamily: 'var(--font-lora, Georgia, serif)' }}>
            &ldquo;Cuidar de quem cuida começa com organização e clareza.&rdquo;
          </blockquote>
          <ul className="space-y-3">
            {['Agenda inteligente de sessões', 'Recibos digitais em segundos', 'Gestão financeira e Carnê-Leão'].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-[#A8D5BC] text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-[#5A9E7C] shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[#5A9E7C] text-xs">Desenvolvido para psicólogos brasileiros</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-[#F7F5F0]">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="bg-[#1B3A2F] rounded-xl p-2">
              <Leaf className="w-5 h-5 text-[#5A9E7C]" strokeWidth={1.5} />
            </div>
            <span className="text-[#1C2B22] font-semibold text-lg">Psico Agenda</span>
          </div>

          <h1 className="text-2xl font-semibold text-[#1C2B22] mb-1" style={{ fontFamily: 'var(--font-lora, Georgia, serif)' }}>
            {modo === 'login' ? 'Bem-vindo de volta' : 'Criar sua conta'}
          </h1>
          <p className="text-[#7A8C82] text-sm mb-8">
            {modo === 'login' ? 'Entre para acessar sua agenda' : 'Comece a organizar seus atendimentos'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#3D5247] mb-1.5">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                className="w-full px-4 py-3 bg-white border border-[#D4CFC6] rounded-xl focus:ring-2 focus:ring-[#5A9E7C] focus:border-[#5A9E7C] outline-none text-sm text-[#1C2B22] placeholder:text-[#B0ABA3] transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3D5247] mb-1.5">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
                className="w-full px-4 py-3 bg-white border border-[#D4CFC6] rounded-xl focus:ring-2 focus:ring-[#5A9E7C] focus:border-[#5A9E7C] outline-none text-sm text-[#1C2B22] placeholder:text-[#B0ABA3] transition-all"
              />
            </div>

            {erro && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{erro}</div>
            )}
            {mensagem && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">{mensagem}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1B3A2F] text-white py-3 rounded-xl font-medium hover:bg-[#244D3F] active:scale-[0.98] transition-all duration-150 disabled:opacity-60 flex items-center justify-center gap-2 text-sm mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {modo === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          <p className="text-center text-sm text-[#7A8C82] mt-6">
            {modo === 'login' ? 'Não tem conta? ' : 'Já tem conta? '}
            <button
              onClick={() => { setModo(modo === 'login' ? 'cadastro' : 'login'); setErro(''); setMensagem('') }}
              className="text-[#2D6A52] font-medium hover:underline"
            >
              {modo === 'login' ? 'Cadastrar-se' : 'Fazer login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
