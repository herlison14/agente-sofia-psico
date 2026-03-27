'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Sessao } from '@/types/psico'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DollarSign, TrendingUp, CalendarCheck, Download, ChevronLeft, ChevronRight } from 'lucide-react'

export default function FinanceiroPage() {
  const { data: session } = useSession()
  const now = new Date()
  const [mes, setMes] = useState(now.getMonth())
  const [ano, setAno] = useState(now.getFullYear())
  const [sessoes, setSessoes] = useState<Sessao[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // demo mode: sem guard de sessao
    setLoading(true)
    const mesStr = `${ano}-${String(mes + 1).padStart(2, '0')}`
    fetch(`/api/sessoes?mes=${mesStr}&status=realizado`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setSessoes(data as Sessao[])
        setLoading(false)
      })
  }, [mes, ano, session])

  function mudarMes(delta: number) {
    let novoMes = mes + delta
    let novoAno = ano
    if (novoMes < 0) { novoMes = 11; novoAno-- }
    if (novoMes > 11) { novoMes = 0; novoAno++ }
    setMes(novoMes)
    setAno(novoAno)
  }

  const receita = sessoes.reduce((acc, s) => acc + Number(s.valor), 0)
  const ticketMedio = sessoes.length > 0 ? receita / sessoes.length : 0

  function exportarCSV() {
    const cabecalho = 'Data,Nome do Paciente,CPF do Paciente,Valor,Descrição'
    const linhas = sessoes.map(s => {
      const data = format(parseISO(s.data_hora), 'dd/MM/yyyy')
      const nome = `"${s.paciente?.nome ?? ''}"`
      const cpf = s.paciente?.cpf ?? ''
      const valor = Number(s.valor).toFixed(2).replace('.', ',')
      return [data, nome, cpf, valor, 'Consulta Psicológica'].join(',')
    })
    const csv = [cabecalho, ...linhas].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `carne-leao-${String(mes + 1).padStart(2, '0')}-${ano}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const nomeMes = format(new Date(ano, mes, 1), 'MMMM yyyy', { locale: ptBR })

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <DollarSign className="w-6 h-6 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => mudarMes(-1)} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
          <span className="text-sm font-semibold text-gray-700 capitalize min-w-36 text-center">{nomeMes}</span>
          <button onClick={() => mudarMes(1)} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight className="w-5 h-5" /></button>
          <button
            onClick={exportarCSV}
            disabled={sessoes.length === 0}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Exportar Carnê-Leão
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="bg-green-50 rounded-lg p-3"><DollarSign className="w-6 h-6 text-green-600" /></div>
          <div>
            <p className="text-sm text-gray-500">Receita total</p>
            <p className="text-2xl font-bold text-gray-900">{receita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="bg-blue-50 rounded-lg p-3"><CalendarCheck className="w-6 h-6 text-blue-600" /></div>
          <div>
            <p className="text-sm text-gray-500">Sessões realizadas</p>
            <p className="text-2xl font-bold text-gray-900">{sessoes.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="bg-indigo-50 rounded-lg p-3"><TrendingUp className="w-6 h-6 text-indigo-600" /></div>
          <div>
            <p className="text-sm text-gray-500">Ticket médio</p>
            <p className="text-2xl font-bold text-gray-900">{ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 capitalize">Sessões realizadas — {nomeMes}</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
          </div>
        ) : sessoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <CalendarCheck className="w-10 h-10 mb-3 opacity-40" />
            <p>Nenhuma sessão realizada neste mês</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Data</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Paciente</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">CPF</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sessoes.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{format(parseISO(s.data_hora), 'dd/MM/yyyy HH:mm')}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{s.paciente?.nome}</td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{s.paciente?.cpf || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{Number(s.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 border-t-2 border-gray-200">
                  <td colSpan={3} className="px-4 py-3 font-semibold text-gray-700">Total</td>
                  <td className="px-4 py-3 font-bold text-green-700 text-base">{receita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
