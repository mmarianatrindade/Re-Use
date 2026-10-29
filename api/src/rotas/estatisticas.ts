import type { EstatisticasPlataforma } from '../../../src/types/api';
import type { Env } from '../env';

// GET /estatisticas — números reais da plataforma para a seção de impacto da Home (sem dados pessoais).
export async function obterEstatisticas(env: Env) {
  const linha = await env.DB.prepare(
    `SELECT
       (SELECT COUNT(*) FROM listings WHERE status = 'disponivel') AS anuncios,
       (SELECT COUNT(*) FROM listings WHERE concluido_em IS NOT NULL) AS reutilizados,
       (SELECT COUNT(*) FROM listings WHERE concluido_em IS NOT NULL AND modalidade = 'doacao') AS doacoes,
       (SELECT COUNT(*) FROM users) AS participantes,
       (SELECT COUNT(*) FROM users WHERE tipo_conta <> 'pessoa') AS organizacoes`,
  ).first<{ anuncios: number; reutilizados: number; doacoes: number; participantes: number; organizacoes: number }>();

  const resposta: EstatisticasPlataforma = {
    anunciosDisponiveis: linha?.anuncios ?? 0,
    itensReutilizados: linha?.reutilizados ?? 0,
    doacoesConcluidas: linha?.doacoes ?? 0,
    participantes: linha?.participantes ?? 0,
    organizacoes: linha?.organizacoes ?? 0,
    atualizadoEm: new Date().toISOString(),
  };
  // Cache curto: os números mudam pouco e a Home é a página mais acessada.
  return new Response(JSON.stringify(resposta), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
  });
}
