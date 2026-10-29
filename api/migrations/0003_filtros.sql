-- Filtros da vitrine: subcategoria, estados novos, troca/doação detalhadas, coordenadas aproximadas e tipo de conta.

ALTER TABLE users ADD COLUMN tipo_conta TEXT NOT NULL DEFAULT 'pessoa';
-- Centro aproximado do CEP (nunca o endereço), para filtrar por distância.
ALTER TABLE users ADD COLUMN latitude REAL;
ALTER TABLE users ADD COLUMN longitude REAL;

ALTER TABLE listings ADD COLUMN subcategoria TEXT NOT NULL DEFAULT 'outros';
ALTER TABLE listings ADD COLUMN valor_estimado_centavos INTEGER;
ALTER TABLE listings ADD COLUMN troca_qualquer_categoria INTEGER NOT NULL DEFAULT 0;
ALTER TABLE listings ADD COLUMN troca_categorias TEXT NOT NULL DEFAULT '[]';
ALTER TABLE listings ADD COLUMN troca_complemento TEXT;
ALTER TABLE listings ADD COLUMN doacao_destino TEXT;
ALTER TABLE listings ADD COLUMN doacao_imediata INTEGER NOT NULL DEFAULT 0;
ALTER TABLE listings ADD COLUMN latitude REAL;
ALTER TABLE listings ADD COLUMN longitude REAL;

-- Categorias antigas -> novas (subcategoria mais próxima).
UPDATE listings SET categoria = 'casa', subcategoria = 'moveis' WHERE categoria = 'moveis';
UPDATE listings SET subcategoria = 'outros-eletronicos' WHERE categoria = 'eletronicos';
UPDATE listings SET categoria = 'moda', subcategoria = 'outros' WHERE categoria = 'roupas';
UPDATE listings SET subcategoria = 'livros' WHERE categoria = 'livros';
UPDATE listings SET categoria = 'bebes', subcategoria = 'outros' WHERE categoria = 'infantil';
UPDATE listings SET subcategoria = 'outros' WHERE categoria IN ('musica', 'esportes', 'ferramentas');
UPDATE listings SET subcategoria = 'outros' WHERE categoria = 'casa' AND subcategoria = 'outros';
UPDATE listings SET categoria = 'casa', subcategoria = 'outros' WHERE categoria = 'outros';

-- Estados antigos -> novos.
UPDATE listings SET condicao = 'usado_bom' WHERE condicao IN ('bom', 'usado');
UPDATE listings SET condicao = 'precisa_reparo' WHERE condicao = 'reparo';

-- Entregas: "ponto" virou "ponto_parceiro".
UPDATE listings SET entregas = REPLACE(entregas, '"ponto"', '"ponto_parceiro"');

-- Defaults coerentes para anúncios existentes.
UPDATE listings SET troca_complemento = 'nao_aceita' WHERE modalidade = 'troca' AND troca_complemento IS NULL;
UPDATE listings SET doacao_destino = 'todos' WHERE modalidade = 'doacao' AND doacao_destino IS NULL;

CREATE INDEX idx_listings_filtros ON listings(status, categoria, subcategoria, condicao);
CREATE INDEX idx_listings_local ON listings(uf, cidade);
