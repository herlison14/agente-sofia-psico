// Dados de demonstração usados quando não há banco configurado

export const DEMO_PSICOLOGO = {
  id: 'demo',
  email: 'demo@psico.com',
  nome: 'Dra. Ana Silva',
  crp: '06/12345',
  cpf: '123.456.789-00',
  telefone: '(11) 99999-9999',
  endereco: 'Rua das Flores, 123 — Sala 4',
  cidade: 'São Paulo',
  estado: 'SP',
  created_at: new Date().toISOString(),
}

const hoje = new Date()
const h = (d: Date) => d.toISOString()

export const DEMO_PACIENTES = [
  { id: 'p1', psicologo_id: 'demo', nome: 'Carlos Mendes', cpf: '111.222.333-44', email: 'carlos@email.com', telefone: '(11) 91111-1111', valor_sessao: 180, ativo: true, created_at: h(hoje) },
  { id: 'p2', psicologo_id: 'demo', nome: 'Fernanda Lima', cpf: '222.333.444-55', email: 'fernanda@email.com', telefone: '(11) 92222-2222', valor_sessao: 150, ativo: true, created_at: h(hoje) },
  { id: 'p3', psicologo_id: 'demo', nome: 'João Santos', cpf: '333.444.555-66', email: null, telefone: '(11) 93333-3333', valor_sessao: 200, ativo: false, created_at: h(hoje) },
]

const s = (h: number, m = 0) => {
  const d = new Date(); d.setHours(h, m, 0, 0); return d.toISOString()
}
const sm = (dias: number, h: number) => {
  const d = new Date(); d.setDate(d.getDate() + dias); d.setHours(h, 0, 0, 0); return d.toISOString()
}

export const DEMO_SESSOES = [
  { id: 's1', psicologo_id: 'demo', paciente_id: 'p1', data_hora: s(9), duracao_min: 50, valor: 180, status: 'agendado', observacoes: null, notas_clinicas: null, created_at: h(hoje), paciente: DEMO_PACIENTES[0] },
  { id: 's2', psicologo_id: 'demo', paciente_id: 'p2', data_hora: s(11), duracao_min: 50, valor: 150, status: 'realizado', observacoes: null, notas_clinicas: 'Paciente relatou melhora na ansiedade. Trabalhamos técnicas de respiração. Evolução positiva.', created_at: h(hoje), paciente: DEMO_PACIENTES[1] },
  { id: 's3', psicologo_id: 'demo', paciente_id: 'p1', data_hora: sm(1, 10), duracao_min: 50, valor: 180, status: 'agendado', observacoes: null, notas_clinicas: null, created_at: h(hoje), paciente: DEMO_PACIENTES[0] },
  { id: 's4', psicologo_id: 'demo', paciente_id: 'p2', data_hora: sm(2, 14), duracao_min: 50, valor: 150, status: 'agendado', observacoes: null, notas_clinicas: null, created_at: h(hoje), paciente: DEMO_PACIENTES[1] },
  { id: 's5', psicologo_id: 'demo', paciente_id: 'p1', data_hora: sm(-3, 9), duracao_min: 50, valor: 180, status: 'realizado', observacoes: null, notas_clinicas: 'Sessão focada em TCC. Identificamos padrões de pensamento automático negativo.', created_at: h(hoje), paciente: DEMO_PACIENTES[0] },
  { id: 's6', psicologo_id: 'demo', paciente_id: 'p2', data_hora: sm(-5, 11), duracao_min: 50, valor: 150, status: 'faltou', observacoes: null, notas_clinicas: null, created_at: h(hoje), paciente: DEMO_PACIENTES[1] },
]

export const DEMO_RECIBOS = [
  { id: 'r1', psicologo_id: 'demo', paciente_id: 'p2', sessao_id: 's2', numero: 1, data_emissao: hoje.toISOString().split('T')[0], valor: 150, descricao: 'Consulta Psicológica', created_at: h(hoje), paciente: DEMO_PACIENTES[1] },
  { id: 'r2', psicologo_id: 'demo', paciente_id: 'p1', sessao_id: 's5', numero: 2, data_emissao: sm(-3, 9).split('T')[0], valor: 180, descricao: 'Consulta Psicológica', created_at: sm(-3, 9), paciente: DEMO_PACIENTES[0] },
]

export const isDemoMode = () => !process.env.DATABASE_URL
