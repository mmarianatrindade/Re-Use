CREATE TABLE request_limits (
  chave TEXT PRIMARY KEY,
  quantidade INTEGER NOT NULL,
  expira_em INTEGER NOT NULL
);
CREATE INDEX idx_request_limits_expira ON request_limits(expira_em);
