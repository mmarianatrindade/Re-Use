# ReUse

**Troque, venda, doe e reutilize.** O ReUse aproxima quem quer passar adiante um objeto usado de quem está procurando por ele, perto de casa. App mobile (iOS e Android) e site, com API própria.

| | Link |
| --- | --- |
| Site (Cloudflare Pages) | <https://reuse-fiapweb2.pages.dev> |
| API (Cloudflare Workers) | <https://reuse-api.r3vmarcos.workers.dev> |
| Saúde da API | <https://reuse-api.r3vmarcos.workers.dev/saude> |

O mesmo código roda no celular (Expo Go ou build nativo) e no navegador (React Native Web).

## Entrega da Fase 3

- [Documento da entrega em PDF](docs/ReUse_Fase3_Entrega.pdf).
- [Texto da documentação](docs/Fase3_Entrega.md), organizado nos três critérios: APIs, autenticação/sessões e caching local.
- Integrantes: Emanuel Secco Eidt (RM567455), Laura Franco Pigosso (RM562157), Mariana Rodrigues Trindade da Silva (RM567137) e Marcos Nunes (RM567631).

Validação local com Node.js 24: `npm run typecheck`, `npm test` e `npm run export:web`. Os testes usam rede e armazenamento simulados, funções de React simuladas e SQLite em memória; não substituem a execução em aparelhos Android/iOS.

Para a demonstração local, execute `npm ci`, `npm run demo:configurar` e `npm run api:migrar:local`. Depois, abra `npm run api:dev` e `npm start` em terminais separados. O comando de configuração preserva arquivos existentes e gera apenas uma chave de desenvolvimento. Em celular físico, ajuste a URL da API no `.env` para o IP do computador na mesma rede.

As migrações devem incluir `0005_limites.sql`. Atualizar o código no GitHub não aplica migrações nem publica a API ou o site na Cloudflare.

O envio real de e-mail está desabilitado na configuração incluída. O modo de desenvolvimento fornece `linkDev`; em produção sem provedor, a recuperação responde com indisponibilidade. O token usa SecureStore no mobile e AsyncStorage na web, com proteções diferentes. Propostas, conversas e pagamentos permanecem no escopo futuro.

### Cache e resiliência

O módulo `src/services/cache.ts` limita a 40 respostas, com chaves v2 e validade de 6 horas para listas, 24 horas para detalhes/estatísticas/ecopontos e 30 dias para CEP. Home, catálogo, detalhe e descarte podem exibir a cópia válida enquanto atualizam pela rede. Fotos usam `expo-image`; NetInfo informa falta de conexão.

Meus anúncios e rascunhos são separados por conta. Logout e expiração invalidam operações antigas e removem esses dados e o cache de respostas; favoritos públicos e o último e-mail permanecem. O cliente da API usa timeout de 15 segundos por tentativa (60 segundos em upload), repete GET uma vez em falhas transitórias e preserva erros de validação por campo. Consultas de CEP têm prazo de 5 segundos.

---

## Sumário

- [O projeto](#o-projeto)
- [Funcionalidades](#funcionalidades)
- [Recursos nativos](#recursos-nativos)
- [Arquitetura](#arquitetura)
- [Stack](#stack)
- [Estrutura de pastas](#estrutura-de-pastas)
- [API](#api)
- [Como rodar localmente](#como-rodar-localmente)
- [Deploy no Cloudflare](#deploy-no-cloudflare)
- [Design](#design)
- [Segurança e privacidade](#segurança-e-privacidade)
- [Escopo e próximas fases](#escopo-e-próximas-fases)
- [Créditos](#créditos)

---

## O projeto

Objetos úteis (móveis, roupas, livros, eletrônicos) ficam parados em casa ou vão para o lixo enquanto outras pessoas e organizações precisam deles e não sabem onde encontrá-los. O ReUse reúne em um só lugar as três formas de dar uma nova vida a esses objetos:

- **Venda**: o que perdeu espaço na sua casa ainda tem valor para alguém.
- **Troca**: o que está parado com você pode ser exatamente o que outra pessoa procura.
- **Doação**: para pessoas ou organizações próximas, sem custo para quem recebe.

Projeto acadêmico (FIAP), desenvolvido em sprints: a Sprint 1 criou a primeira impressão da plataforma, a Sprint 2 trouxe conta, perfil, publicação e gestão de anúncios com dados reais, e a Fase 3 acrescenta resiliência das APIs, renovação da sessão e cache local de respostas.

## Funcionalidades

### Navegação

- **Celular e tablet**: barra inferior com Início, Catálogo, **Anunciar** (tag central em destaque), Negociações e Perfil. A barra continua visível nas telas internas.
- **Site em tela larga (≥ 900 px)**: header fixo no topo com o logo e os mesmos itens.
- Links diretos na web (ex.: `/anuncios/:id`, `/meus-anuncios/:id`) e deep links no app (ativação de conta e redefinição de senha).

### Início

- Hero em tela cheia com a colagem de objetos reutilizáveis, título "TROQUE / VENDA / DOE / REUTILIZE" com a inicial de cada palavra na cor da modalidade e busca "O que procura?", que abre o Catálogo com o termo digitado.
- **Nas proximidades**: um carrossel por modalidade (venda, troca e doação) com os 5 anúncios mais próximos do endereço do perfil (ou os mais recentes, sem login) e "Confira mais", que abre o Catálogo já filtrado.
- Carrossel das modalidades (Vender, Trocar, Doar e Reutilizar).
- Números reais de impacto (`/estatisticas`) numa frase, só com os valores maiores que zero.
- Para quem ainda não tem conta: "Como funciona" em quatro passos e convite para criar a conta.
- Tocar em "Início" no menu leva direto à busca, com os anúncios logo abaixo.

### Catálogo e filtros

- Grade de anúncios com 2, 3 ou 4 colunas conforme a tela, busca por texto, filtro rápido por modalidade e ordenação (mais recentes ou mais perto).
- Modal de filtros com seções recolhidas e resumo do que está aplicado:
  - **Categorias** em uma coluna, em ordem alfabética, com subcategorias e **busca indexada** a partir de 2 letras (ex.: "pr" encontra Prateleiras), sem diferenciar acentos.
  - **Estado do produto**, do mais conservado ao mais desgastado (escolha múltipla).
  - **Faixa de preço** com slider de duas alças (R$ 0 até sem limite) e "Somente itens grátis".
  - **Localização**: todo o Brasil, minha cidade, meu estado ou **distância de 0 a 1.000 km** (slider), usando o GPS do aparelho.
  - **Forma de recebimento** (escolha múltipla) e anúncios com mais de uma forma.
  - **Para troca**: troca por qualquer categoria, categoria aceita (com a mesma busca indexada), complemento em dinheiro, "tenho" e "procuro".
  - **Para doação**: destino (pessoas ou organizações) e condições de retirada/entrega.
- Detalhe do anúncio com galeria de ponta a ponta, preço na cor da modalidade, anunciante, **Salvar**, **Compartilhar** e **Denunciar**.

### Descarte consciente em São Paulo

- Tela pública `/descarte`, aberta pelo Início ou menu do perfil, com busca por nome, endereço, distrito e subprefeitura.
- `GET /ecopontos` consulta a camada municipal `geoportal:ecoponto` no [WFS do GeoSampa](https://wfs.geosampa.prefeitura.sp.gov.br/geoserver/geoportal/wfs?service=WFS&version=2.0.0&request=GetFeature&typeNames=geoportal%3Aecoponto&outputFormat=application%2Fjson&srsName=EPSG%3A4326&count=500). A resposta validada inclui endereços, coordenadas, horários e recebimento por unidade; não existe lista fictícia de reserva.
- Filtros: móveis/volumosos, entulho, poda, recicláveis secos e gesso. O aceite de gesso depende do campo específico da unidade. A base pode ter defasagem; a tela mostra quando foi consultada e links para as fontes.
- Lista de oito locais por vez; mapa no fim com **todos** os resultados filtrados. Ver no mapa foca o marcador; Como chegar abre o Google Maps com o destino, sem solicitar GPS.
- Leaflet 1.9.4 na web e em WebView no Android/iOS. CSS/ícones e o script mobile vêm do unpkg. Tiles do OpenStreetMap com atribuição, identificação do app na WebView e cache HTTP padrão; sem prefetch ou download offline. [Política dos tiles](https://operations.osmfoundation.org/policies/tiles/).
- Cache local da lista por 24 horas, atualização em seguida e aviso se falhar. O servidor compartilha consultas concorrentes, guarda uma resposta por uma hora por instância, espera até 10 segundos pela fonte e limita a rota a 30 requisições/minuto/IP.
- A [fonte oficial](https://metadados.geosampa.prefeitura.sp.gov.br/geonetwork/intranet/api/records/ab117be9-ad7f-41a2-a3ee-cba5709d04b2) informa os locais. Outros resíduos têm link para [Recicla Sampa](https://www.reciclasampa.com.br/pontos-de-coleta).
- Para aparecer no endereço hospedado, é necessário publicar tanto a API quanto o app. O push para o GitHub não executa essa publicação.

### Conta

- **Cadastro em 5 etapas**: acesso (nome, e-mail e senha), dados de segurança (CPF, celular e data de nascimento, com validação de maioridade), endereço com preenchimento pelo CEP e sugestões de endereço, **selfie com a câmera frontal** e revisão com aceite dos termos.
- **Login e sessão**: token opaco com validade de 7 dias, renovado perto do vencimento e guardado no SecureStore no Android/iOS ou AsyncStorage na web. Bloqueio temporário após 5 senhas erradas e recuperação por link de 30 minutos quando o envio está configurado (link de desenvolvimento no ambiente local). Ao sair, o app encerra o estado local imediatamente e tenta revogar a sessão na API, conforme a conexão.
- **Perfil**: foto, nome público, descrição, localização pública (CEP, bairro e cidade, **nunca o número da casa**), reputação, selos, impacto e tipo de conta. CPF mascarado, telefone e endereço completo aparecem só para a própria pessoa.

### Anúncios

- **Publicar em 5 etapas**: até **5 fotos** (câmera ou galeria, com escolha da capa), título, descrição, categoria e subcategoria, estado, modalidade (venda com preço e ofertas, troca com preferências, doação), formas de entrega e revisão. A localização vem do perfil. O rascunho fica salvo no AsyncStorage a cada alteração.
- **Meus anúncios**: filtros por status (disponível, reservado, negociando, concluído, arquivado), visualizações e contatos, edição, arquivamento, exclusão conforme as regras e pedido de destaque.
- **Negociações** e **Salvos**.

## Recursos nativos

| Recurso | Uso |
| --- | --- |
| Câmera (`expo-image-picker`) | Selfie no cadastro e no perfil; fotos do anúncio |
| Galeria | Alternativa à câmera; seleção múltipla nos anúncios |
| `expo-image-manipulator` | Redimensiona as fotos (lado maior 1600 px) antes do envio |
| Localização (`expo-location`) | Filtro por distância e ordenação "mais perto" |
| SecureStore (`expo-secure-store`) | Token de sessão (Keychain no iOS, Keystore no Android) |
| AsyncStorage | Cache de respostas, rascunho, Meus anúncios, salvos e último e-mail; na web, também a sessão |
| Deep links (`expo-linking`) | Ativação de conta e redefinição de senha |
| Compartilhar (`Share`) | Compartilhar anúncio (na web, copia o link) |

## Arquitetura

```text
┌──────────────────────────┐        HTTPS/JSON        ┌───────────────────────────┐
│ App Expo (iOS / Android) │ ───────────────────────▶ │ Cloudflare Worker         │
│ Site (React Native Web,  │                          │ reuse-api                 │
│ Cloudflare Pages)        │ ◀─────────────────────── │  ├─ D1 reuse-db (dados    │
└──────────────────────────┘                          │  │   e fotos)             │
                                                      │  ├─ Google Places (proxy) │
                                                      │  └─ Geocodificação        │
                                                      └───────────────────────────┘
```

- O app e o site são o mesmo código Expo: o site é gerado com `expo export -p web` e publicado no Cloudflare Pages.
- A API é um Worker em TypeScript, com roteador próprio e sem framework.
- Os schemas Zod (`src/schemas/`) e os tipos (`src/types/api.ts`) são **compartilhados** entre app e API: a mesma regra valida o formulário e a requisição.
- As fotos ficam no próprio D1 (tabela `arquivos`, até 1,5 MB cada) nesta versão; a camada de arquivos pode trocar para R2 sem mudar as rotas.

## Stack

| Camada | Tecnologias |
| --- | --- |
| App | Expo SDK 53, React Native 0.79, React 19, TypeScript (strict), React Native Web |
| Navegação | React Navigation 7 (native stack + bottom tabs) |
| Formulários | React Hook Form + Zod 4 |
| Gráficos | react-native-svg (símbolos vetoriais das tags) |
| API | Cloudflare Workers (TypeScript), Cloudflare D1 (SQLite) |
| Site | Cloudflare Pages |
| Endereço | ViaCEP (CEP) e Google Places (sugestões), com geocodificação em cadeia (Google, AwesomeAPI, Nominatim e BrasilAPI) |

## Estrutura de pastas

```text
Re-Use/
├── App.tsx                 # entrada Expo que encaminha para src/App.tsx
├── api/                    # API (Cloudflare Workers + D1)
│   ├── migrations/         # esquema do banco (0001 a 0004)
│   ├── src/
│   │   ├── rotas/          # auth, perfil, anúncios, vitrine, arquivos, endereços, estatísticas
│   │   ├── cripto.ts       # PBKDF2, AES-GCM, HMAC
│   │   ├── sessao.ts       # tokens de sessão
│   │   ├── geo.ts          # geocodificação e distância
│   │   └── index.ts        # roteador e CORS
│   └── wrangler.jsonc      # Worker reuse-api e banco reuse-db
├── assets/                 # fontes, logos, tags, colagem de fundo e fotos (WebP)
├── src/
│   ├── App.tsx             # fontes, área segura, sessão e navegação
│   ├── components/         # componentes reutilizáveis
│   ├── constants/          # cores, tipografia, fontes, imagens, raios
│   ├── contexts/           # sessão, login, cadastro, renovação e saída
│   ├── data/               # textos da Início e créditos das fotos
│   ├── hooks/              # responsividade, movimento reduzido e dados
│   ├── navigation/         # abas, pilhas, tipos, ícones e deep links
│   ├── schemas/            # validação Zod e catálogo compartilhados com a API
│   ├── screens/            # telas agrupadas por anúncios, autenticação e perfil
│   ├── services/           # cliente da API, sessão, câmera, CEP e anúncios
│   ├── types/              # contratos compartilhados da API e tipos de tela
│   └── utils/              # máscaras, formatação e avisos
└── wrangler.jsonc          # projeto do Cloudflare Pages (reuse-fiapweb2)
```

## API

URL de produção: `https://reuse-api.r3vmarcos.workers.dev`

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/saude` | Verificação de funcionamento |
| POST | `/auth/cadastro` | Criar conta |
| POST | `/auth/login` | Entrar (devolve o token de sessão) |
| POST | `/auth/renovar` | Renovar a sessão |
| POST | `/auth/sair` | Revogar a sessão |
| POST | `/auth/ativar` · `/auth/reenviar-ativacao` | Ativação de conta |
| POST | `/auth/recuperar` · `/auth/redefinir` | Recuperação de senha |
| GET · PATCH | `/me` | Dados da própria conta |
| GET | `/usuarios/:id` | Perfil público |
| POST | `/uploads` | Envio de foto |
| GET | `/anuncios` | Catálogo com filtros (modalidade, categoria, subcategoria, estado, preço, grátis, texto, `lat`/`lng`/`raioKm`, cidade, UF, entregas, troca, doação, ordenação) |
| GET | `/anuncios/:id` | Anúncio público |
| POST · PUT · DELETE | `/anuncios` · `/anuncios/:id` | Publicar, editar e excluir |
| PATCH | `/anuncios/:id/status` | Mudar status |
| POST · DELETE | `/anuncios/:id/destaque` | Pedir ou cancelar destaque |
| POST | `/anuncios/:id/visualizacao` | Contar visualização |
| POST | `/anuncios/:id/denuncia` | Denunciar anúncio |
| GET | `/meus-anuncios` · `/meus-anuncios/:id` | Anúncios da própria conta |
| GET | `/enderecos/sugestoes` · `/enderecos/lugar/:id` | Sugestões de endereço (proxy do Google Places) |
| GET | `/estatisticas` | Números de impacto da plataforma |

Rotas autenticadas usam `Authorization: Bearer <token>`.

## Como rodar localmente

### Pré-requisitos

- Node.js compatível com o Expo SDK 53 e npm.
- Expo Go no celular, emulador Android/iOS ou navegador.
- Conta Cloudflare apenas para publicar (a API roda localmente com D1 simulado).

### 1. Instalar

```bash
npm ci
```

### 2. Configurar

```bash
cp .env.example .env                        # EXPO_PUBLIC_API_URL: URL da API usada pelo app
cp api/.dev.vars.example api/.dev.vars      # segredos da API local (CPF_CHAVE)
```

- Para usar a API publicada, coloque `EXPO_PUBLIC_API_URL=https://reuse-api.r3vmarcos.workers.dev` no `.env`.
- No celular físico ou no emulador Android, `localhost` não aponta para o computador: use o IP da máquina na rede.
- `.env` e `api/.dev.vars` são ignorados pelo git. Nunca coloque chaves em variáveis `EXPO_PUBLIC_`: elas vão para o código do app.

### 3. API local (opcional)

```bash
npm run api:migrar:local   # cria as tabelas no D1 local
npm run api:dev            # API em http://localhost:8787
```

Sem envio de e-mail configurado, a API em desenvolvimento devolve o link de ativação e de recuperação, e o app mostra o botão **Abrir link do e-mail**.

### 4. App

```bash
npm start
```

Leia o QR Code com o Expo Go, escolha um emulador ou pressione `w` para abrir no navegador. Depois de mudar o `.env`, reinicie com `npm start -- --clear`.

## Deploy no Cloudflare

| Recurso | Nome |
| --- | --- |
| Pages (site) | `reuse-fiapweb2` → <https://reuse-fiapweb2.pages.dev> |
| Worker (API) | `reuse-api` → <https://reuse-api.r3vmarcos.workers.dev> |
| Banco D1 | `reuse-db` |

```bash
npx wrangler login                                      # uma vez

# API
npx wrangler secret put CPF_CHAVE -c api/wrangler.jsonc              # chave de cifragem do CPF
npx wrangler secret put GOOGLE_PLACES_API_KEY -c api/wrangler.jsonc  # sugestões de endereço
npm run api:migrar                                      # migrações no D1 remoto
npm run api:deploy                                      # publica o Worker

# Site
npm run export:web:producao                             # gera e valida dist/ com a API online
npx wrangler pages deploy dist --project-name reuse-fiapweb2 --branch master
```

O comando `npm run deploy` também prepara e valida a versão de produção antes de enviar ao mesmo projeto Pages. A preparação seleciona `https://reuse-api.r3vmarcos.workers.dev`, ignora o `.env` local e limpa o cache de compilação para impedir o reaproveitamento de uma URL de desenvolvimento. A API e as migrações continuam sendo publicadas separadamente pelos comandos acima.

Variáveis do Worker (em `api/wrangler.jsonc`): `APP_URL`, `ORIGENS_PERMITIDAS` (CORS), `EXIGIR_CONFIRMACAO_EMAIL` e `EMAIL_REMETENTE`. A confirmação de e-mail está desligada nesta versão de teste, porque ainda não há domínio para envio; para ligar, habilite o Email Sending do Cloudflare no domínio, descomente `send_email`, preencha `EMAIL_REMETENTE` e mude `EXIGIR_CONFIRMACAO_EMAIL` para `"true"`.

> Em redes com inspeção de TLS, comandos que acessam a internet (`wrangler`, `expo`) podem precisar de `NODE_OPTIONS=--use-system-ca`.

## Design

- **Cores por modalidade**, iguais em tags, preços e filtros: venda em âmbar, troca em azul, doação em vermelho, "negociando" em cinza e o verde da marca para o restante (`src/constants/colors.ts`).
- **Tags do logo** como ícones: cada modalidade tem a sua etiqueta, e os símbolos dentro delas são vetoriais (`src/components/Glifo.tsx`).
- **Tipografia** com Bricolage Grotesque nos títulos e Plus Jakarta Sans nos textos; corpo de 16/24 e leitura longa de 17/26 (`src/constants/tipografia.ts`).
- **Colagem própria** de objetos reutilizáveis no hero da Início e, em recortes aleatórios, nos banners das abas.
- **Mobile first** e responsivo: celular, tablet e desktop, com header no site e barra inferior no celular.
- Acessibilidade: rótulos para leitor de tela, áreas de toque de pelo menos 44 px, sliders ajustáveis por leitor de tela e movimento reduzido respeitado (o parallax do hero é o único movimento automático).

## Segurança e privacidade

- Senhas com hash **PBKDF2** (100 mil iterações).
- CPF cifrado com **AES-GCM** e um **HMAC** para impedir CPF duplicado sem guardá-lo em texto.
- Tokens de sessão opacos, guardados na API só como hash SHA-256, com validade de 7 dias e rotação.
- A localização pública mostra CEP, bairro e cidade, **nunca o número**; a distância entre anúncios é aproximada.
- Chaves (`CPF_CHAVE`, `GOOGLE_PLACES_API_KEY`) ficam como segredos do Worker, nunca no app.
- CORS restrito às origens do site e do ambiente local.

## Escopo e próximas fases

- **Sprint 1**: primeira impressão da plataforma (Início).
- **Sprint 2**: cadastro, login, perfil, publicação e gestão de anúncios, catálogo com filtros e dados reais.
- **Próximas fases**: propostas e chat de negociação, pagamentos (o destaque fica "aguardando pagamento"), avaliações, Pontos ReUse (PR) para trocas e doações, mapa, verificação de organizações e painel administrativo.

## Créditos

- Fotos do [Wikimedia Commons](https://commons.wikimedia.org/), usadas conforme suas licenças livres; os créditos completos aparecem no rodapé do app ("Créditos das fotos").
- Fontes Bricolage Grotesque e Plus Jakarta Sans sob a SIL Open Font License.
- Logo, tags e colagem: arte própria do ReUse.
