'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Psicologo } from '@/types/psico'
import { Loader2, Save, UserCircle } from 'lucide-react'

export default function PerfilPage() {
  const { data: session } = useSession()
  const [form, setForm] = useState<Partial<Psicologo>>({
    nome: '', crp: '', cpf: '', email: '', telefone: '', endereco: '', cidade: '', estado: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    // demo mode: sem guard de sessao
    fetch('/api/psicologos')
      .then(r => r.json())
      .then(data => {
        if (data) setForm(data)
        else setForm(f => ({ ...f, email: session?.user?.email ?? '' }))
        setLoading(false)
      })
  }, [session])

  function handleChange(field: keyof Psicologo, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErro('')
    setSucesso(false)

    const res = await fetch('/api/psicologos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (!res.ok) {
      const data = await res.json()
      setErro('Erro ao salvar: ' + (data.error ?? 'Tente novamente.'))
    } else {
      setSucesso(true)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  const Field = ({ label, field, placeholder, type = 'text' }: { label: string; field: keyof Psicologo; placeholder?: string; type?: string }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={(form[field] as string) ?? ''}
        onChange={(e) => handleChange(field, e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
      />
    </div>
  )

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <UserCircle className="w-7 h-7 text-indigo-600" />
        <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <Field label="Nome completo" field="nome" placeholder="Dr. João Silva" />
          </div>
          <Field label="CRP" field="crp" placeholder="06/12345" />
          <Field label="CPF" field="cpf" placeholder="000.000.000-00" />
          <Field label="E-mail" field="email" placeholder="contato@email.com" type="email" />
          <Field label="Telefone" field="telefone" placeholder="(11) 99999-9999" />
          <div className="sm:col-span-2">
            <Field label="Endereço completo" field="endereco" placeholder="Rua das Flores, 123, Sala 4 — Jardim Paulista" />
          </div>
          <Field label="Cidade" field="cidade" placeholder="São Paulo" />
          <Field label="Estado" field="estado" placeholder="SP" />
        </div>

        {sucesso && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-lg text-sm">
            Perfil salvo com sucesso!
          </div>
        )}
        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm">
            {erro}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar perfil
          </button>
        </div>
      </form>
    </div>
  )
}
