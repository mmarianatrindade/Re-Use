<<<<<<< HEAD
# ReUse

Projeto de Sprint 1 para a plataforma ReUse.

## Objetivo
Criar a tela inicial de um aplicativo mobile que apresenta o projeto, explica o problema do descarte incorreto e mostra como funciona a decomposição de materiais.

## Como usar
### Versão React Native
1. Instale as dependências:
   ```bash
   npm install
   ```
2. Abra o app com Expo:
   ```bash
   npm start
   ```
3. Execute no emulador ou no celular via Expo Go.

### Versão web React
1. Abra `index.html` no navegador ou use uma extensão como Live Server.
2. A interface web usa React via CDN com HTML, CSS e JavaScript separados.

## Arquitetura
- `App.js`: tela inicial mobile React Native.
- `components/SectionHeader.js`: componente reutilizável para títulos e subtítulos.
- `components/InfoCard.js`: componente reutilizável para exibir cards de conteúdo.
- `index.html`: página web React para apresentação do ReUse.
- `styles.css`: estilo da versão web.
- `main.js`: lógica e componentes React da versão web.
