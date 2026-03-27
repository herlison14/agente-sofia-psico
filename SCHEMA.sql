-- Schema para PostgreSQL (Railway) — sem dependência do Supabase Auth
-- Rodar este script no banco PostgreSQL do Railway

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS psicologos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nome TEXT,
  crp TEXT,
  cpf TEXT,
  telefone TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psicologo_id UUID REFERENCES psicologos ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  cpf TEXT,
  email TEXT,
  telefone TEXT,
  valor_sessao NUMERIC(10,2) DEFAULT 150,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psicologo_id UUID REFERENCES psicologos ON DELETE CASCADE NOT NULL,
  paciente_id UUID REFERENCES pacientes ON DELETE CASCADE NOT NULL,
  data_hora TIMESTAMPTZ NOT NULL,
  duracao_min INT DEFAULT 50,
  valor NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'agendado' CHECK (status IN ('agendado','realizado','cancelado')),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recibos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psicologo_id UUID REFERENCES psicologos ON DELETE CASCADE NOT NULL,
  paciente_id UUID REFERENCES pacientes ON DELETE CASCADE NOT NULL,
  sessao_id UUID REFERENCES sessoes ON DELETE SET NULL,
  numero INT NOT NULL,
  data_emissao DATE DEFAULT CURRENT_DATE,
  valor NUMERIC(10,2) NOT NULL,
  descricao TEXT DEFAULT 'Consulta Psicológica',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pacientes_psicologo ON pacientes(psicologo_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_psicologo ON sessoes(psicologo_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_data_hora ON sessoes(data_hora);
CREATE INDEX IF NOT EXISTS idx_recibos_psicologo ON recibos(psicologo_id);
