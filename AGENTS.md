# ReUse — contexto do projeto

## Produto

Plataforma que conecta pessoas e organizações para **vender, trocar e doar** produtos usados. Especificação completa em `ReUse_paginas_funcionalidades_detalhado.pdf` e `ReUse_paginas_funcionalidades_resumido.pdf`.

Regras que a interface deve respeitar mesmo em protótipo:

- Venda sustenta o negócio; troca e doação são metas sociais/ambientais.
- Primeira troca gratuita; trocas seguintes podem ter taxa administrativa.
- Receber doação é sempre gratuito; contribuição pós-doação é voluntária.
- Não existe moeda ReUse, créditos ou pontos com valor financeiro.
- Localização pública: CEP, bairro, cidade e UF; CPF, telefone, rua, número e complemento nunca são públicos.
- Anúncios patrocinados devem ser identificados como tais.
- Indicadores de impacto precisam de metodologia; números sem ela são marcados como demonstrativos.

## Stack

- Expo SDK 53, React Native 0.79, React 19, TypeScript (strict).
- Plataformas: iOS, Android e web (`react-native-web`).
- Entrada: `node_modules/expo/AppEntry.js` → `App.tsx` (entrada Expo) → `src/App.tsx` (fontes, `SafeAreaProvider`, `SessaoProvider`) → `src/navigation/AppNavigator.tsx`.
- Navegação: React Navigation 7 (native-stack + bottom-tabs). Abas (decisão do usuário): Home, Anúncios (vitrine pública: `GET /anuncios` com filtros e `AnuncioDetalhe`), + Anunciar (botão central elevado), Negociações (equivale a "Operações" do doc técnico: hoje os próprios anúncios com "Em andamento"; propostas e chat entram aqui na Fase 4) e Perfil; cada aba tem a própria pilha (`PilhaAbaParamList`) com as telas internas compartilhadas (detalhe, perfil público, editar perfil, gerenciar/editar/destacar anúncio), então o menu inferior aparece nelas. Na pilha raiz ficam só os fluxos de tela cheia sem menu: entrar, cadastro, confirmar/ativar e-mail, recuperar/redefinir senha e termos. Config de deep links das abas tipada à parte (`configAbas`), porque o TS não infere o 2º nível dentro de `LinkingOptions`. Tipos em `src/navigation/tipos.ts` (inclui `ReactNavigation.RootParamList` global); deep links em `src/navigation/linking.ts` (`/ativar?token=`, `/redefinir-senha?token=`).
- Formulários: React Hook Form + Zod 4 (`@hookform/resolvers`). Schemas em `src/schemas/`, **compartilhados com a API** (sem imports de React Native ou Workers).
- Recursos nativos: `expo-image-picker` (câmera/galeria), `expo-image-manipulator` (redimensiona para 1600 px antes do upload), `expo-secure-store` (token), `@react-native-async-storage/async-storage` (cache/rascunho), `expo-linking`.
- Dependências nativas instaladas com `EXPO_OFFLINE=1 npx expo install ...` (a consulta online de compatibilidade do Expo falha nesta máquina).
- `expo-font` + `expo-asset` (dependência obrigatória do expo-font; ambos instalados via `npx expo install`) para Bricolage Grotesque (títulos) e Plus Jakarta Sans (textos), TTFs locais em `assets/fonts/`. Usar `fonts.*` de `src/constants/fonts.ts` e nunca `fontWeight` junto com fonte customizada.
- Sem biblioteca de gradiente; animações somente com `Animated` do React Native.

## API (api/)

- Cloudflare Worker `reuse-api` (`api/wrangler.jsonc`, separado do Pages da raiz), publicado em <https://reuse-api.r3vmarcos.workers.dev>. Bindings: `DB` (D1 `reuse-db`, id `0c233025-eba1-4532-8c11-bbc259dfa8cc`), `EMAIL` (`send_email`, comentado até haver domínio habilitado). Segredo `CPF_CHAVE` (32 bytes base64; local em `api/.dev.vars`, cópia da chave de produção em `api/.dev.vars.producao`, ambos fora do git).
- **Fotos no D1** (tabela `arquivos`, BLOB, até 1,5 MB por imagem): app de teste sem R2 (R2 exige plano ativado na conta). Para voltar ao R2, trocar só `api/src/rotas/arquivos.ts` e o binding.
- `EXIGIR_CONFIRMACAO_EMAIL="false"` (decisão do usuário enquanto não há domínio de e-mail): cadastro não envia ativação e publicar não exige e-mail confirmado; login continua obrigatório. `UsuarioPrivado.exigeConfirmacaoEmail` informa o app.
- Rede local usa inspeção TLS: comandos Node/Wrangler/Expo que acessam a internet precisam de `NODE_OPTIONS=--use-system-ca`; `npm start` usa `--offline`.
- `--env dev` (`npm run api:dev`): `AMBIENTE=desenvolvimento`, `APP_URL=http://localhost:8081`. Sem e-mail configurado, só em desenvolvimento a API devolve `linkDev`; o app mostra `LinkDevBanner`, que navega para a tela do link dentro do app.
- Roteador próprio em `api/src/index.ts` (sem framework). Erros de regra: `ErroApi(status, codigo, mensagem, campos?)`; validação com os schemas de `src/schemas/` (422 com `campos`).
- Senha PBKDF2-SHA256 100k (limite do Workers); token de sessão opaco de 256 bits, banco guarda só SHA-256; sessão de 7 dias, `POST /auth/renovar` faz rotação. Links de e-mail de uso único (`UPDATE ... RETURNING`). Redefinir senha revoga todas as sessões.
- CPF: `cpf_cifrado` (AES-GCM) + `cpf_hash` (HMAC, único) + `cpf_final` (2 dígitos para exibir mascarado). Nunca retornar CPF em claro.
- Uploads: `POST /uploads?tipo=perfil|anuncio` (bytes crus, JPG/PNG/WebP, até 1,5 MB), chave `usuarios/<userId>/<tipo>/<uuid>.<ext>`; a posse é conferida pelo prefixo + existência na tabela `arquivos`. Fotos servidas por `GET /arquivos/<chave>` (imutáveis).
- Migrações em `api/migrations/` (`npm run api:migrar:local` / `api:migrar`). Contratos de resposta em `src/types/api.ts`.

## Regras de produto (Sprint 2)

- Cadastro: 18+ (data de nascimento), CPF válido e único, celular com DDD, endereço (CEP via ViaCEP), selfie obrigatória e aceite versionado (`TERMOS_VERSAO` em `src/schemas/comum.ts`, gravado em `terms_acceptances`).
- Nome público padrão: primeiro nome + inicial do sobrenome.
- Localização pública do usuário/anúncio: **CEP, bairro, cidade e UF** (decisão do usuário: o CEP é público); rua, número e complemento nunca são públicos.
- Publicar exige foto de rosto (e e-mail confirmado quando `EXIGIR_CONFIRMACAO_EMAIL` não for "false") (a foto identifica a pessoa na entrega de trocas e doações). Anúncio copia a localização do perfil só se houver retirada, Correios ou transportadora.
- Status: transições em `TRANSICOES_STATUS` (`src/schemas/anuncio.ts`). Editar só em disponível/arquivado e nunca após concluído; excluir só sem conclusão (senão arquivar); concluído não volta a disponível.
- Destaque: planos em `PLANOS_DESTAQUE`; o pedido fica `aguardando_pagamento` até a integração de pagamentos (Fase 6).
- AsyncStorage guarda apenas dados não sensíveis (rascunho do anúncio, cache de "Meus anúncios", último e-mail). Ao sair, apaga sessão, cache e rascunho.

## Endereço (ViaCEP + Google Places)

- Mesmo padrão do projeto Iara Games: ViaCEP no campo CEP (`buscarEnderecoPorCep`, direto do aparelho) e Google Places (autocomplete + detalhe, endpoints legados) via proxy na API: `GET /enderecos/sugestoes?texto=&sessao=` e `GET /enderecos/lugar/:id?sessao=` (`api/src/rotas/enderecos.ts`). A chave fica só no Worker (segredo `GOOGLE_PLACES_API_KEY`); `sessao` = sessiontoken do Google (digitação + escolha cobradas como uma sessão).
- `src/components/BuscaEndereco.tsx` no topo de `CamposEndereco` (cadastro e editar perfil): sugestões com atraso de 350 ms; ao escolher, preenche CEP, rua, número, bairro, cidade e UF. Sem a chave, a API responde 503 `PLACES_NAO_CONFIGURADO` e o campo some.
- Com a chave, o Google também é a 1ª fonte de coordenadas do CEP na API (`geocodificarCep`).

## Filtros da vitrine (aba Anúncios)

- Catálogo em `src/schemas/catalogo.ts` (compartilhado app/API): 18 categorias com subcategorias (id = slug do rótulo), 9 estados, formas de recebimento (`retirada`, `correios`, `transportadora`, `ponto_reuse`, `ponto_parceiro`, `entrega`), tipos de anunciante, faixas de preço e raios. Migração `0003_filtros.sql` remapeou dados antigos.
- Modal `src/components/FiltrosModal.tsx` (seções recolhíveis; rascunho aplicado em "Ver resultados"). Estado em `src/types/filtros.ts`; parâmetros montados em `listarVitrine` (`src/services/anunciosService.ts`); API em `api/src/rotas/vitrine.ts`. Filtros de troca/doação implicam a modalidade.
- Distância: GPS do aparelho (`expo-location`, precisão baixa, pedido só quando o filtro precisa) × coordenada aproximada do CEP do anunciante (3 casas decimais, nunca publicada). A coordenada do CEP é consultada **pelo aparelho** na AwesomeAPI (`buscarCoordenadasPorCep`) e enviada com o endereço: a AwesomeAPI devolve 429 para o IP compartilhado dos Workers. Reserva na API (`api/src/geo.ts`): AwesomeAPI → Nominatim → BrasilAPI (esta às vezes só dá o centro da cidade). Filtro por raio = caixa no SQL + haversine em JS; "mais próximos" pagina em JS sobre até 500 candidatos.
- "Minha cidade/estado" usa o endereço do perfil; sem perfil, o GPS (reverse geocode só no celular). "Ver no mapa" e "Pontos ReUse (PR)" aparecem como "em breve" (PR = sistema de pontos futuro, sem valor monetário).
- Tipo de anunciante: `users.tipo_conta`, escolhido no cadastro/perfil e exibido como "(declarado)" até existir verificação de organizações.
- Publicar coleta subcategoria, estado, valor estimado da troca (só referência), categorias desejadas/qualquer categoria, complemento financeiro, destino da doação e disponibilidade imediata. Localização do anúncio vem sempre do perfil.

## Estrutura

- `src/screens/HomeScreen.tsx`: Home em página única com seções e rolagem animada ("Entrar"/"Criar conta" navegam para as telas reais).
- `src/screens/auth/` (cadastro em etapas em `auth/cadastro/`), `src/screens/perfil/`, `src/screens/anuncios/` (formulário de publicar/editar em `anuncios/publicar/`).
- `src/contexts/SessaoContext.tsx`: sessão (status `carregando | anonimo | autenticado`); `AppNavigator` só renderiza depois de restaurar o token.
- `src/services/`: `api.ts` (ApiClient, `EXPO_PUBLIC_API_URL`), `armazenamento.ts` (SecureStore/AsyncStorage), `midiaService.ts` (câmera, galeria, upload), `cepService.ts`, `authService.ts`, `perfilService.ts`, `anunciosService.ts`.
- Componentes de formulário/telas internas: `Screen` (rolagem + teclado + rodapé fixo), `TextField`/`FormTextField` (máscara, erro junto ao campo), `ChipSelect`, `Checkbox`, `StepIndicator`, `Banner`, `ActionSheet`, `PrimaryButton`, `AuthGate`, `FotoRostoPicker`, `FotosAnuncioPicker`, `AnuncioPreview`, `AnuncioCard`, `PerfilPublicoCard`, `CamposEndereco`.
- `src/hooks/useAcoesAnuncio.ts`: mudar status, arquivar, excluir e montar ações do anúncio (confirmações incluídas).
- `src/components/`: CabecalhoBanner (banner das telas principais das abas, recorte aleatório da colagem), ScrollSection (seção que registra seu offset para menu/âncoras), Scrim (degradê em faixas), TagIcon, SectionHeader, InfoCard, ModalityCard, ItemCard, StepCard, CarrosselModalidade (anúncios de uma modalidade + "Confira mais"), ModalityCarousel (4 cartões em carrossel abaixo de 900px, botões abaixo; no desktop, grade 2×2 ou 4 colunas), ExploreFilters (busca + modalidade + categorias com contagem, usado na seção e na barra fixa), SegmentedControl (indicador deslizante), PressableScale (resposta ao toque).
- `src/hooks/useResponsive.ts`: breakpoints (tablet ≥ 700, desktop ≥ 1024), gutter e largura máxima de 1200.
- `src/constants/`: `colors.ts` (paleta do logo), `fonts.ts`, `images.ts` (logos, tags, `fundo` e fotos), `radii.ts` (raios por hierarquia).
- `assets/images/fundo/`: colagem de itens do ReUse (`bg_hero.webp`, gerado de `../assets/imagens/bg_hero.png`) no hero da Home e recortes dela (`recorte_casa` na tela Entrar, `recorte_lazer` no `AuthGate`, `recorte_infantil` nos estados vazios de Anúncios/Negociações) via `src/components/ImagemCapa.tsx` (decorativa, oculta do leitor de tela). Arte própria: não entra nos créditos do Commons.
- `src/hooks/useReduceMotion.ts`: preferência do sistema por menos movimento (usar em toda animação).
- `src/data/reuseData.ts`: conteúdo fixo da Home (modalidades, etapas, impacto demonstrativo; categorias vêm de `src/schemas/anuncio.ts`); `src/data/photoCredits.ts`: autoria/licença das fotos.
- `src/utils/formatPrice.ts`: rótulo de preço (R$, "Gratuito" na doação, "Aberto a propostas" na troca). `src/utils/webFocusStyles.ts`: CSS de foco visível (`:focus-visible`) injetado só na web.
- `src/utils/showMessage.ts`: `Alert.alert` no mobile, `window.alert` na web (Alert não funciona no react-native-web).
- `assets/images/`: logos em WebP gerados a partir de `../assets/logo/*.png`; `assets/images/photos/`: fotos do Wikimedia Commons em WebP.

## Decisões

- **Ícones e marcadores usam sempre o `TagIcon`** com a tag do contexto (`tipo`): `venda` (dourada), `troca` (azul), `doacao` (vermelha) para tudo de cada modalidade; `negociando` (cinza) sempre junto da tag da modalidade (`TagsAnuncio`, e no `StatusBadge`); demais assuntos usam a tag do logo (`padrao`). Imagens em `assets/images/tags/` (WebP gerado de `../assets/tags/*.png`). Modalidades: Vender `R$`, Trocar `⇄`, Doar `♥` (`tag` em `reuseData.ts` e `modalidadeInfo`). Cores das modalidades (`colors.sale/trade/donation`) seguem as tags em tons escuros legíveis. Não usar emoji solto nem círculos genéricos. Números de etapas/cards também vão na tag.
- Hero ocupa 100% da largura e a altura visível (janela menos a barra de abas, mínimo 560).
- Animações de scroll usam `useNativeDriver` fora da web; na web o Animated roda em JS.
- Offsets das seções vêm do `onLayout` do `ScrollSection`, que precisa ser filho direto do conteúdo do ScrollView.
- Sistema visual (skill frontend-design, revisão de 2026-09): foto primeiro, alinhado à esquerda; **cartão só para o que é tocável** (anúncios, via `src/components/CardAnuncio.tsx`, único no app, variantes "grade" e "linha"); informação é texto com espaço e divisor fino (`colors.divider`), nunca caixa. Cor por tipo em par forte/suave (`colors.sale/saleSoft`, `trade/tradeSoft`, `donation/donationSoft`, `negotiating/negotiatingSoft`; `modalidadeInfo.cor/corSuave`): preço e selo da modalidade usam a cor; status em tons discretos. Lima só em momentos de marca (R do hero, botão central). Escala em `src/constants/tipografia.ts` (corpo 16/24, leitura 17/26, mínimo 13; blocos de texto até `LARGURA_LEITURA`). Sem rótulos em caixa alta fora do hero (exceção pedida: "NAS PROXIMIDADES"), sem `→`, sem `·`. Ícones das tags e do menu em vetor (`src/components/Glifo.tsx`, react-native-svg), não símbolos de texto.
- Movimento automático: só o parallax do hero, desligado com "reduzir movimento". Nenhum carrossel troca sozinho.
- Home: seção "NAS PROXIMIDADES" com três carrosséis (`src/components/CarrosselModalidade.tsx`: venda, troca, doação), 5 anúncios cada + bloco "Confira mais +" que abre a aba Anúncios filtrada. Logado, a API ordena pelos mais próximos do endereço do perfil (`ordenar=proximos` sem lat/lng usa o ponto do usuário); sem login, destaques pagos e depois recentes. Dados em `src/hooks/useAnunciosHome.ts`. Impacto com números reais de `GET /estatisticas` (cache 5 min). Seção de modalidades tem 4 cartões (vender, trocar, doar e "Reutilizar", que abre todos os anúncios); no carrossel os botões ficam abaixo. Cabeçalho sempre em vidro claro com o logo completo (`logo_completo_horizontal.webp`), sem botão Entrar.
- Preços, contagens e números de impacto usam `fontVariant: ['tabular-nums']` (as duas fontes têm `tnum`).
- Home (app com abas): hero + busca, "NAS PROXIMIDADES" (3 carrosséis), impacto em frase só com números > 0; modalidades, como funciona e convite só para quem não tem conta. Sem barra de progresso, botão de topo nem menu de âncoras.
- Detalhe do anúncio: galeria de ponta a ponta (`AnuncioPreview` com `colarNoTopo`), preço, selos, anunciante logo abaixo, depois seções com divisor. Ações: Salvar (`src/services/salvosService.ts`, AsyncStorage, tela `Salvos` no Perfil), Compartilhar (Share nativo; na web copia o link) e Denunciar (`POST /anuncios/:id/denuncia`, tabela `reports`, uma por pessoa). "Meu anúncio" usa verbos nos botões de status ("Marcar como reservado"). Anunciar: categoria/subcategoria em `SeletorLista` (lista com busca). Cadastro: tipo de conta atrás de um link (padrão pessoa). Web ≥ 900 px: cabeçalho no topo (`src/components/CabecalhoWeb.tsx`, `tabBar` customizado com `tabBarPosition: 'top'`, `usaCabecalhoWeb`, altura `ALTURA_CABECALHO_WEB`); emite `tabPress` como a barra inferior. Nesse modo o logo sai do hero da Início e dos banners das abas.
- Carrossel de modalidades (< 900px, só para quem não tem conta): botões abaixo dos cards, sem troca automática.
- Fotos com licença CC BY/BY-SA exigem crédito: manter README e `photoCredits.ts` atualizados ao trocar imagens.

## Deploy

- Cloudflare Pages (clássico, não Workers), projeto `reuse-fiapweb2`: <https://reuse-fiapweb2.pages.dev>. Branch de produção: `master`.
- Configuração em `wrangler.jsonc` (`pages_build_output_dir: dist`); o `name` precisa continuar `reuse-fiapweb2`.
- `npm run deploy` = `expo export -p web` (gera `dist/`, ignorado no git) + `wrangler pages deploy dist --project-name reuse-fiapweb2 --branch master`. Não usar `wrangler deploy` (isso publica como Worker em workers.dev). Deploy só quando o usuário pedir.
- O deploy antigo em `reuse-fiapweb2.r3vmarcos.workers.dev` (Worker) foi excluído.

## Fases

- **Sprint 1**: Home demonstrativa (`z_entregas/1_entrega.md`).
- **Sprint 2 (atual)**: cadastro, login/recuperação, perfil, publicar e meus anúncios com API real (`z_entregas/2_entrega.md`; arquitetura em `z_entregas/ReUse_doc_tec_*.pdf`).
- Próximas fases: Propostas e Chat (na aba Negociações; hoje o botão do detalhe só avisa), Pagamentos, Avaliações, Admin etc. Busca da vitrine usa LIKE; FTS5 depois.
