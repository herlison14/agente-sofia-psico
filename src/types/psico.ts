export interface Psicologo {
  id: string
  nome: string | null
  crp: string | null
  cpf: string | null
  email: string | null
  telefone: string | null
  endereco: string | null
  cidade: string | null
  estado: string | null
  created_at: string
}

export interface Paciente {
  id: string
  psicologo_id: string
  nome: string
  cpf: string | null
  email: string | null
  telefone: string | null
  valor_sessao: number
  ativo: boolean
  created_at: string
}

export interface Sessao {
  id: string
  psicologo_id: string
  paciente_id: string
  data_hora: string
  duracao_min: number
  valor: number
  status: 'agendado' | 'realizado' | 'cancelado' | 'faltou'
  observacoes: string | null
  notas_clinicas: string | null
  created_at: string
  paciente?: Paciente
}

export interface Recibo {
  id: string
  psicologo_id: string
  paciente_id: string
  sessao_id: string | null
  numero: number
  data_emissao: string
  valor: number
  descricao: string
  created_at: string
  paciente?: Paciente
}
