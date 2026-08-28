# ReUse — Sprint 1 Mobile

Projeto desenvolvido para a **Sprint 1 — ReUse | Mobile**, com foco na criação do primeiro contato do usuário com uma plataforma de economia sustentável, reutilização de produtos e consumo consciente.

## Contexto da Sprint

A ReUse nasce para apoiar pessoas que têm dúvidas sobre o que fazer com produtos e materiais que deixaram de ser úteis. Em vez de tratar o descarte como primeira opção, a proposta incentiva uma sequência mais consciente: **identificar, reutilizar ou doar e, quando necessário, reciclar corretamente**.

Nesta Sprint, o objetivo é apresentar essa proposta em uma tela inicial mobile simples, clara e preparada para evoluções futuras.

## Proposta de valor

A ReUse ajuda o usuário a tomar decisões mais responsáveis antes do descarte, reunindo orientações rápidas sobre reuso, doação, reciclagem e destino adequado de materiais.

## Decisões de interface

- **Mobile first:** a interface foi organizada verticalmente para funcionar bem em telas menores.
- **Hierarquia visual simples:** títulos, textos curtos, cards e botões destacam as informações mais importantes.
- **Identidade sustentável:** tons de verde reforçam visualmente a proposta de consumo consciente.
- **Conteúdo em etapas:** a jornada foi dividida em problema, proposta de valor, funcionamento, materiais e ecopontos.
- **Interação simples:** o usuário pode selecionar materiais, abrir uma dica e buscar ecopontos.
- **Sem complexidade desnecessária:** não foram adicionados backend, banco de dados, autenticação ou animações, pois não fazem parte do escopo desta fase.

## Componentes React Native utilizados

O projeto utiliza componentes básicos do React Native, incluindo:

- `View`
- `Text`
- `Button`
- `TouchableOpacity`
- `ScrollView`
- `SafeAreaView`
- `StatusBar`

A organização visual utiliza **Flexbox**, principalmente por meio de `flexDirection`, `justifyContent`, `alignItems` e `flexWrap`.

## Componentes reutilizáveis

Foram criados e utilizados componentes reutilizáveis para evitar repetição e manter consistência visual:

- `SectionHeader`: títulos e subtítulos das seções.
- `InfoCard`: cards informativos usados em diferentes partes da tela.
- `StepCard`: etapas do funcionamento da ReUse.

## Estrutura do projeto

```text
Re-Use-main/
├── App.js
├── app.json
├── babel.config.js
├── package.json
├── README.md
├── components/
│   ├── InfoCard.js
│   ├── SectionHeader.js
│   └── StepCard.js
└── data/
    └── reuseData.js
```

### Responsabilidade dos arquivos

- `App.js`: monta a tela inicial e controla as interações principais.
- `components/SectionHeader.js`: componente reutilizável para cabeçalhos de seção.
- `components/InfoCard.js`: componente reutilizável para informações em cards.
- `components/StepCard.js`: componente reutilizável para as etapas do fluxo ReUse.
- `data/reuseData.js`: concentra os dados exibidos pela interface e evita conteúdo repetido dentro da tela principal.

## Como executar

### Pré-requisitos

- Node.js compatível com o Expo SDK 53.
- npm instalado.
- Expo Go no celular ou emulador configurado.

### Instalação

```bash
npm install
```

### Executar o projeto

```bash
npm start
```

Depois, utilize o QR Code exibido pelo Expo para abrir o projeto no Expo Go ou escolha um emulador Android/iOS.

### Verificação das dependências

Se necessário, execute:

```bash
npx expo install --check
```

ou:

```bash
npx expo-doctor
```

## Escopo desta entrega

Esta versão contempla apenas a Sprint 1. Não foram implementados:

- backend;
- banco de dados;
- autenticação real;
- APIs externas para dados da plataforma;
- animações ou microinterações avançadas.

A navegação entre múltiplas telas também não foi adicionada, pois é opcional nesta etapa.
