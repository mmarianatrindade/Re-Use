import { z } from 'zod';

export const FONTE_ECOPONTOS = 'https://metadados.geosampa.prefeitura.sp.gov.br/geonetwork/intranet/api/records/ab117be9-ad7f-41a2-a3ee-cba5709d04b2';
export const MATERIAIS_DESCARTE = [
  { id: 'moveis', label: 'Móveis e volumosos' },
  { id: 'entulho', label: 'Entulho' },
  { id: 'poda', label: 'Restos de poda' },
  { id: 'reciclaveis', label: 'Recicláveis secos' },
  { id: 'gesso', label: 'Gesso' },
] as const;
export const materialDescarteSchema = z.enum(['moveis', 'entulho', 'poda', 'reciclaveis', 'gesso']);
export type MaterialDescarte = z.infer<typeof materialDescarteSchema>;

export const ecopontoSchema = z.object({
  id: z.string().min(1).max(100),
  nome: z.string().min(1).max(200),
  endereco: z.string().min(1).max(500),
  distrito: z.string().max(200),
  subprefeitura: z.string().max(200),
  horario: z.string().max(500),
  recebimento: z.string().max(800),
  materiais: z.array(materialDescarteSchema).max(5),
  latitude: z.number().finite().min(-24.1).max(-23.3),
  longitude: z.number().finite().min(-46.9).max(-46.3),
});
export type Ecoponto = z.infer<typeof ecopontoSchema>;
export const respostaEcopontosSchema = z.object({
  pontos: z.array(ecopontoSchema).min(1).max(500),
  consultadoEm: z.string().datetime(),
  // Data da consulta ao serviço, não uma promessa de atualização feita pela Prefeitura.
  fonte: z.literal(FONTE_ECOPONTOS),
});
export type RespostaEcopontos = z.infer<typeof respostaEcopontosSchema>;
