-- Identidade, sessão, catálogo e reputação do ReUse (Fase 2 e 3).
-- Datas em ISO 8601 (UTC). IDs gerados pela API (UUID).

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  nome_completo TEXT NOT NULL,
  nome_publico TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  telefone TEXT NOT NULL,
  -- CPF cifrado (AES-GCM); cpf_hash (HMAC) garante unicidade sem expor o número.
  cpf_cifrado TEXT NOT NULL,
  cpf_hash TEXT NOT NULL UNIQUE,
  cpf_final TEXT NOT NULL,
  data_nascimento TEXT NOT NULL,
  foto_chave TEXT,
  cep TEXT,
  logradouro TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  uf TEXT,
  email_confirmado_em TEXT,
  tentativas_login INTEGER NOT NULL DEFAULT 0,
  bloqueado_ate TEXT,
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL
);

-- O token nunca é salvo: apenas o hash SHA-256.
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  dispositivo TEXT,
  criado_em TEXT NOT NULL,
  expira_em TEXT NOT NULL,
  revogado_em TEXT
);
CREATE INDEX idx_sessions_user ON sessions(user_id);

-- Links de ativação de e-mail e de redefinição de senha (uso único).
CREATE TABLE email_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('ativacao', 'recuperacao')),
  token_hash TEXT NOT NULL UNIQUE,
  criado_em TEXT NOT NULL,
  expira_em TEXT NOT NULL,
  usado_em TEXT
);
CREATE INDEX idx_email_tokens_user ON email_tokens(user_id, tipo);

CREATE TABLE terms_acceptances (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  versao TEXT NOT NULL,
  aceito_em TEXT NOT NULL,
  ip TEXT,
  dispositivo TEXT
);

CREATE TABLE listings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL,
  condicao TEXT NOT NULL,
  modalidade TEXT NOT NULL CHECK (modalidade IN ('venda', 'troca', 'doacao')),
  preco_centavos INTEGER,
  aceita_ofertas INTEGER NOT NULL DEFAULT 0,
  preferencia_troca TEXT,
  entregas TEXT NOT NULL, -- JSON: ["retirada","correios",...]
  -- Localização pública copiada do perfil quando há retirada, Correios ou transportadora.
  cep TEXT,
  bairro TEXT,
  cidade TEXT,
  uf TEXT,
  status TEXT NOT NULL DEFAULT 'disponivel'
    CHECK (status IN ('disponivel', 'reservado', 'negociando', 'concluido', 'arquivado')),
  visualizacoes INTEGER NOT NULL DEFAULT 0,
  contatos INTEGER NOT NULL DEFAULT 0,
  destaque_ate TEXT,
  concluido_em TEXT,
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL
);
CREATE INDEX idx_listings_user ON listings(user_id, atualizado_em);
CREATE INDEX idx_listings_status ON listings(status, modalidade, categoria);

CREATE TABLE listing_images (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  chave TEXT NOT NULL,
  ordem INTEGER NOT NULL
);
CREATE INDEX idx_listing_images_listing ON listing_images(listing_id, ordem);

-- Pedidos de destaque: ficam aguardando pagamento até a integração com o provedor (Fase 6).
CREATE TABLE highlight_orders (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plano TEXT NOT NULL,
  dias INTEGER NOT NULL,
  preco_centavos INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'aguardando_pagamento'
    CHECK (status IN ('aguardando_pagamento', 'ativo', 'cancelado')),
  criado_em TEXT NOT NULL
);
CREATE INDEX idx_highlight_orders_listing ON highlight_orders(listing_id, status);

-- Avaliações após operações (preenchidas pelo fluxo de operações, Fase 4/5).
CREATE TABLE ratings (
  id TEXT PRIMARY KEY,
  avaliado_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  autor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id TEXT REFERENCES listings(id) ON DELETE SET NULL,
  nota INTEGER NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario TEXT,
  criado_em TEXT NOT NULL,
  UNIQUE (autor_id, listing_id)
);
CREATE INDEX idx_ratings_avaliado ON ratings(avaliado_id, criado_em);
