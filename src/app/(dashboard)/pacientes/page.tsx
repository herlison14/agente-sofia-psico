'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Paciente } from '@/types/psico'
import { Plus, Search, Edit2, ToggleLeft, ToggleRight, Users, X, Loader2 } from 'lucide-react'

const EMPTY: Partial<Paciente> = {
  nome: '', cpf: '', email: '', telefone: '', valor_sessao: 150, ativo: true
}

export default function PacientesPage() {
  const { data: session } = useSession()
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<Partial<Paciente>>(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')

  async function loadPacientes() {
    const res = await fetch('/api/pacientes')
    const data = await res.json()
    if (Array.isArray(data)) setPacientes(data)
    setLoading(false)
  }

  useEffect(() => {
    // demo mode: sem guard de sessao
    loadPacientes()
  }, [session])

  function openNew() { setForm(EMPTY); setEditId(null); setErro(''); setModalOpen(true) }
  function openEdit(p: Paciente) { setForm(p); setEditId(p.id); setErro(''); setModalOpen(true) }
  function handleChange(field: keyof Paciente, value: string | number | boolean) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome?.trim()) { setErro('Nome é obrigatório.'); return }
    setSaving(true)
    setErro('')

    let res: Response
    if (editId) {
      res = await fetch(`/api/pacientes/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    } else {
      res = await fetch('/api/pacientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    }

    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setErro(data.error ?? 'Erro ao salvar.'); return }
    setModalOpen(false)
    loadPacientes()
  }

  async function toggleAtivo(p: Paciente) {
    await fetch(`/api/pacientes/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...p, ativo: !p.ativo }),
    })
    loadPacientes()
  }

  const filtrados = pacientes.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (p.email ?? '').toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Novo paciente
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por nome ou e-mail..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
          </div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Users className="w-10 h-10 mb-3 opacity-40" />
            <p>Nenhum paciente encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nome</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">CPF</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">E-mail</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Telefone</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Valor Sessão</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtrados.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.nome}</td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{p.cpf || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{p.email || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{p.telefone || '—'}</td>
                    <td className="px-4 py-3 text-gray-700 font-medium">
                      {Number(p.valor_sessao).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleAtivo(p)} className="flex items-center gap-1.5 text-sm">
                        {p.ativo
                          ? <><ToggleRight className="w-5 h-5 text-green-500" /><span className="text-green-600">Ativo</span></>
                          : <><ToggleLeft className="w-5 h-5 text-gray-400" /><span className="text-gray-400">Inativo</span></>}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">{editId ? 'Editar paciente' : 'Novo paciente'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                  <input
                    type="text"
                    value={form.nome ?? ''}
                    onChange={e => handleChange('nome', e.target.value)}
                    required
                    placeholder="Nome completo"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                  <input
                    type="text"
                    value={form.cpf ?? ''}
                    onChange={e => handleChange('cpf', e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={form.telefone ?? ''}
                    onChange={e => handleChange('telefone', e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={form.email ?? ''}
                    onChange={e => handleChange('email', e.target.value)}
                    placeholder="paciente@email.com"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor padrão da sessão (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.valor_sessao ?? 150}
                    onChange={e => handleChange('valor_sessao', parseFloat(e.target.value))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              {erro && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">{erro}</div>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editId ? 'Salvar alterações' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
