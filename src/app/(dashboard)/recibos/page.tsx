'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Recibo, Psicologo } from '@/types/psico'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FileText, Download, AlertCircle } from 'lucide-react'

function valorPorExtenso(valor: number): string {
  const reais = Math.floor(valor)
  const centavos = Math.round((valor - reais) * 100)
  const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez',
    'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove']
  const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa']
  const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos']

  function numToWords(n: number): string {
    if (n === 0) return ''
    if (n === 100) return 'cem'
    if (n < 20) return unidades[n]
    if (n < 100) {
      const d = Math.floor(n / 10)
      const u = n % 10
      return dezenas[d] + (u > 0 ? ' e ' + unidades[u] : '')
    }
    const c = Math.floor(n / 100)
    const resto = n % 100
    return centenas[c] + (resto > 0 ? ' e ' + numToWords(resto) : '')
  }

  function numMilToWords(n: number): string {
    if (n >= 1000) {
      const mil = Math.floor(n / 1000)
      const resto = n % 1000
      const milStr = mil === 1 ? 'mil' : numToWords(mil) + ' mil'
      return milStr + (resto > 0 ? ' e ' + numToWords(resto) : '')
    }
    return numToWords(n)
  }

  const reaisStr = reais === 0 ? 'zero reais' : numMilToWords(reais) + (reais === 1 ? ' real' : ' reais')
  const centavosStr = centavos > 0 ? ' e ' + numToWords(centavos) + (centavos === 1 ? ' centavo' : ' centavos') : ''
  return (reaisStr + centavosStr).trim()
}

async function gerarPDF(recibo: Recibo, psicologo: Psicologo) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pw = doc.internal.pageSize.getWidth()

  const indigo = [79, 70, 229] as [number, number, number]
  const gray = [100, 116, 139] as [number, number, number]
  const dark = [17, 24, 39] as [number, number, number]

  doc.setFillColor(...indigo)
  doc.rect(0, 0, pw, 40, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('RECIBO DE PAGAMENTO', pw / 2, 18, { align: 'center' })
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Consulta Psicológica', pw / 2, 26, { align: 'center' })
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(`Nº ${String(recibo.numero).padStart(6, '0')}`, pw / 2, 34, { align: 'center' })

  let y = 52
  doc.setTextColor(...gray)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('PSICÓLOGO(A)', 20, y)
  y += 5
  doc.setTextColor(...dark)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(psicologo.nome ?? '', 20, y)
  y += 6
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...gray)
  if (psicologo.crp) doc.text(`CRP: ${psicologo.crp}`, 20, y)
  if (psicologo.cpf) doc.text(`CPF: ${psicologo.cpf}`, 100, y)
  y += 5
  if (psicologo.endereco) doc.text(psicologo.endereco, 20, y)
  if (psicologo.cidade || psicologo.estado) { y += 4; doc.text(`${psicologo.cidade ?? ''}${psicologo.estado ? '/' + psicologo.estado : ''}`, 20, y) }
  if (psicologo.telefone) { y += 4; doc.text(`Tel: ${psicologo.telefone}`, 20, y) }

  y += 8
  doc.setDrawColor(229, 231, 235)
  doc.setLineWidth(0.4)
  doc.line(20, y, pw - 20, y)
  y += 8
  doc.setTextColor(...gray)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('PACIENTE', 20, y)
  y += 5
  doc.setTextColor(...dark)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(recibo.paciente?.nome ?? '', 20, y)
  y += 6
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...gray)
  if (recibo.paciente?.cpf) doc.text(`CPF: ${recibo.paciente.cpf}`, 20, y)
  if (recibo.paciente?.email) doc.text(recibo.paciente.email, 100, y)

  y += 10
  doc.line(20, y, pw - 20, y)
  y += 10
  doc.setFillColor(249, 250, 251)
  doc.roundedRect(20, y - 5, pw - 40, 28, 3, 3, 'F')
  doc.setTextColor(...gray)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('DESCRIÇÃO DO SERVIÇO', 28, y)
  doc.text('DATA', pw - 70, y)
  doc.text('VALOR', pw - 40, y)
  y += 6
  doc.setTextColor(...dark)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(recibo.descricao ?? 'Consulta Psicológica', 28, y)
  doc.text(format(parseISO(recibo.data_emissao), 'dd/MM/yyyy'), pw - 70, y)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...indigo)
  doc.text(Number(recibo.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), pw - 40, y)
  y += 10
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(...gray)
  doc.text(`Valor por extenso: ${valorPorExtenso(Number(recibo.valor))}`, 28, y)

  y += 20
  doc.line(20, y, pw - 20, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...gray)
  doc.text('Emitido em conformidade com a Resolução CFP nº 11/2018', pw / 2, y, { align: 'center' })
  y += 5
  doc.text(`Emitido em: ${format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}`, pw / 2, y, { align: 'center' })
  y += 20
  doc.line(pw / 2 - 40, y, pw / 2 + 40, y)
  y += 5
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...dark)
  doc.text(psicologo.nome ?? '', pw / 2, y, { align: 'center' })
  y += 4
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...gray)
  doc.text(`Psicólogo(a) — CRP ${psicologo.crp ?? ''}`, pw / 2, y, { align: 'center' })

  doc.save(`recibo-${String(recibo.numero).padStart(6, '0')}-${recibo.paciente?.nome?.replace(/\s+/g, '-') ?? 'paciente'}.pdf`)
}

export default function RecibosPage() {
  const { data: session } = useSession()
  const [recibos, setRecibos] = useState<Recibo[]>([])
  const [psicologo, setPsicologo] = useState<Psicologo | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [semPerfil, setSemPerfil] = useState(false)

  useEffect(() => {
    // demo mode: sem guard de sessao
    Promise.all([
      fetch('/api/psicologos').then(r => r.json()),
      fetch('/api/recibos').then(r => r.json()),
    ]).then(([psicData, recibosData]) => {
      if (psicData) setPsicologo(psicData)
      else setSemPerfil(true)
      if (Array.isArray(recibosData)) setRecibos(recibosData as Recibo[])
      setLoading(false)
    })
  }, [session])

  async function handleDownload(recibo: Recibo) {
    if (!psicologo) { alert('Preencha seu perfil antes de gerar o PDF.'); return }
    setDownloadingId(recibo.id)
    await gerarPDF(recibo, psicologo)
    setDownloadingId(null)
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-6 h-6 text-indigo-600" />
        <h1 className="text-2xl font-bold text-gray-900">Recibos</h1>
      </div>

      {semPerfil && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-6 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Preencha os dados do seu perfil para gerar PDFs completos.
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
          </div>
        ) : recibos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <FileText className="w-10 h-10 mb-3 opacity-40" />
            <p>Nenhum recibo emitido ainda</p>
            <p className="text-xs mt-1">Gere recibos marcando sessões como realizadas na Agenda</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nº</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Data</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Paciente</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Descrição</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Valor</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recibos.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-indigo-600 font-semibold">#{String(r.numero).padStart(6, '0')}</td>
                    <td className="px-4 py-3 text-gray-600">{format(parseISO(r.data_emissao), 'dd/MM/yyyy')}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{r.paciente?.nome}</td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{r.descricao}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{Number(r.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDownload(r)}
                        disabled={downloadingId === r.id}
                        className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 text-sm font-medium disabled:opacity-50"
                      >
                        <Download className="w-4 h-4" />
                        {downloadingId === r.id ? 'Gerando...' : 'PDF'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
