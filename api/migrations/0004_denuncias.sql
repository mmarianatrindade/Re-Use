-- Denúncias de anúncios (moderação na fase de administração).
CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  autor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  motivo TEXT NOT NULL,
  detalhes TEXT,
  status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'analisada', 'descartada')),
  criado_em TEXT NOT NULL,
  -- Uma denúncia por pessoa e anúncio.
  UNIQUE (listing_id, autor_id)
);
CREATE INDEX idx_reports_status ON reports(status, criado_em);
