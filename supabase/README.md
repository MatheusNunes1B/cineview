# CineView com Supabase

O catálogo inteiro vem da tabela public.titles. Sem conexão, sem configuração ou com a tabela vazia, nenhuma página exibe filmes ou séries. O botão Tentar novamente refaz a consulta. O app não carrega www/data no navegador: esses arquivos servem apenas para gerar o SQL inicial.

## Ativação

1. Preencha .env.local com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (chave pública). Reinicie npm run dev após mudar o arquivo.
2. No SQL Editor do Supabase execute, nesta ordem:
   - migrations/202609250001_collections.sql, se ainda não foi executado;
   - migrations/202609250003_titles_details.sql;
   - seed.sql (agora inclui pôster, descrição, gêneros e demais dados de cada título).
3. Execute npm install e npm run dev. Na página inicial e nas páginas Filmes e Séries, a consulta vem de public.titles. Recarregue a página após aplicar o SQL.

O comando npm run db:seed regenera seed.sql quando os dados de origem mudarem. Reaplique-o no SQL Editor para publicar novos filmes e séries.

## Cadastro sem confirmação

No painel do Supabase, abra Authentication > Providers > Email, desative Confirm Email e salve. O cadastro passa a devolver uma sessão imediatamente; o CineView entra na conta após Criar conta. Essa opção pertence ao projeto Supabase e não pode ser alterada pela chave pública do app. Contas criadas antes da mudança que ainda estejam pendentes podem exigir confirmação manual em Authentication > Users ou um novo cadastro.

## Persistência

Favoritos, lista e assistidos são gravados somente em public.user_collections para usuários autenticados. Visitantes podem navegar no catálogo online, mas precisam entrar para salvar títulos. Nenhuma coleção é gravada em localStorage. A sessão de login usa sessionStorage apenas para continuar entre páginas na mesma aba; ela termina quando a aba é fechada. Dados antigos de cineview:* em localStorage, se existirem, são ignorados e não são apagados automaticamente.

As políticas RLS da primeira migração permitem ler titles publicamente e limitam user_collections ao dono. Nunca coloque service_role ou sb_secret_ no frontend.

A tabela public.produtos do exemplo antigo é independente e não é usada. O arquivo cleanup-produtos.sql remove essa tabela no SQL Editor somente se ainda tiver exatamente os dois registros de demonstração.

## Testes e build

- npm test: testes locais de carregamento e persistência.
- npm run build: compila as seis páginas em dist.
- npm run android:sync: compila e sincroniza o Android.

Para conferir a conexão, abra Network no navegador e procure /rest/v1/titles; o retorno deve incluir a coluna details. Recarregue a página offline para verificar a mensagem de erro, sem filmes locais. Teste login e uma lista com duas contas para confirmar o isolamento.
