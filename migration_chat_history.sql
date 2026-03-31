-- Migration: tabela de histórico de conversas para o agente WhatsApp (n8n)
-- Executar no mesmo banco PostgreSQL (Railway) do psico-agenda

CREATE TABLE IF NOT EXISTS chat_history (
  id          BIGSERIAL PRIMARY KEY,
  session_id  TEXT NOT NULL,           -- número de telefone do paciente
  message     JSONB NOT NULL,          -- { type: 'human'|'ai', content: string }
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_history_session ON chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created ON chat_history(session_id, created_at DESC);
