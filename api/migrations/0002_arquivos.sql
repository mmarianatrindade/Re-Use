-- Fotos (perfil e anúncios) guardadas no próprio D1 enquanto o app é de teste (R2 exige plano ativado).
-- Limite do D1: 2 MB por linha; a API aceita até 1,5 MB por imagem e o app já envia as fotos redimensionadas.
CREATE TABLE arquivos (
  chave TEXT PRIMARY KEY, -- usuarios/<userId>/<tipo>/<uuid>.<ext>
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  tamanho INTEGER NOT NULL,
  dados BLOB NOT NULL,
  criado_em TEXT NOT NULL
);
CREATE INDEX idx_arquivos_user ON arquivos(user_id);
