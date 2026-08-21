# CineView

Uma plataforma pessoal, responsiva e cinematográfica para descobrir e organizar filmes e séries. Construída somente com HTML5, Tailwind CSS (CDN), JavaScript ES Modules e `localStorage`.

## Executar

Abra `index.html` com um servidor local (por exemplo, a extensão Live Server). Nenhuma instalação é necessária.

## Estrutura

- `data/`: catálogo mockado separado por tipo;
- `js/storage.js`: persistência centralizada;
- `js/ui.js`: componentes reutilizáveis;
- `js/pages.js` e módulos de página: composição e comportamento.

A separação de dados, persistência, renderização e eventos facilita uma futura migração para React/Vite sem incluir essas tecnologias agora.
