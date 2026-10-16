# Login e cadastro com Supabase + Google

Site: https://cineview-app.pages.dev
Repositório: https://github.com/MatheusNunes1B/cineview

## Implementação

- Telas móveis Login e Cadastro em React: src/components/AuthScreen.jsx. E-mail/senha chamam signInWithPassword e signUp; nome segue em options.data.full_name. Erros de formulário permitem corrigir os campos e reenviar sem travar a aplicação.
- AuthContext compartilha usuário, sessão, operações e estado de carregamento. getSession e onAuthStateChange alimentam o controlador serializado em authPersistence.js. Preferences mantém a sessão, sem um segundo armazenamento do SDK.
- App.jsx exige sessão antes de montar qualquer página interna ou consultar coleções. Após login, a página originalmente solicitada aparece; após logout, aparece Login. As políticas RLS da migração continuam limitando o CRUD ao próprio user_id: a interface não substitui a segurança do banco.
- Entrar com Google usa signInWithOAuth com provider google e redirectTo da origem do site (preserva subdiretório de hospedagem). O SDK processa o retorno web; a sessão fica persistida antes de liberar o catálogo.
- Minha conta exibe full_name/nome, e-mail e avatar HTTPS, quando disponíveis. Sair da conta chama signOut com escopo local e limpa sessão/coleções.
- No Android, Browser abre o OAuth fora da WebView e App recebe com.cineview://auth/callback, inclusive em uma abertura nova. setSession valida os tokens e salva em Preferences. O retorno só é aceito se houver tentativa iniciada no app há menos de 15 minutos.

## Configuração obrigatória nos painéis

O frontend usa somente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em .env.local, que está ignorado pelo Git. Client Secret Google nunca entra em VITE_, HTML, APK ou repositório.

### Google Cloud

1. Abra https://console.cloud.google.com/ e selecione/crie um projeto.
2. Em Google Auth Platform, configure Branding/tela de consentimento com nome CineView e e-mails de contato. Audience: Externo. Se estiver em modo de teste, inclua os e-mails que participarão da validação.
3. Use apenas os escopos básicos openid, email e profile.
4. Em Clients (ou APIs e Serviços → Credenciais), crie um ID OAuth do tipo Aplicativo da Web.
5. Origens JavaScript autorizadas: https://cineview-app.pages.dev e http://localhost:5173.
6. URI de redirecionamento autorizada, exatamente:

   https://mkvquytdwfgtdoyibclk.supabase.co/auth/v1/callback

7. Copie Client ID e Client Secret diretamente para o painel do Supabase, não para arquivos do frontend.

### Supabase

Projeto: https://supabase.com/dashboard/project/mkvquytdwfgtdoyibclk

1. Authentication → Sign In / Providers → Google: habilite, informe Client ID e Client Secret, salve.
2. Authentication → URL Configuration → Site URL: https://cineview-app.pages.dev
3. Adicione em Redirect URLs:
   - https://cineview-app.pages.dev
   - http://localhost:5173
   - com.cineview://auth/callback (APK)
4. Salve e inicie o fluxo pelo botão Entrar com Google no CineView.

Não abra manualmente a URL callback do Supabase: ela é usada no retorno do provedor, com parâmetros gerados durante o login. OAuth state parameter missing indica retorno incompleto; inicie uma tentativa nova pelo botão. Não remova a validação state. Retorno a localhost:3000 sugere Site URL padrão ou redirectTo fora da lista permitida. redirect_uri_mismatch exige comparar a URI do Google com o callback acima, caractere por caractere.

## Validação e evidências da entrega

As verificações automatizadas usam respostas simuladas; não comprovam consentimento Google real nem a criação de um usuário no servidor.

Depois de configurar os painéis:
1. Abra o site no celular ou uma janela sem sessão. Capture a tela com Entrar com Google.
2. Toque no botão, escolha a conta e autorize. Confirme o retorno ao catálogo e abra Minha conta. Capture nome/e-mail/foto exibidos.
3. No painel Supabase, Authentication → Users, localize o mesmo e-mail e capture seu registro. Oculte dados de outras pessoas.
4. Atualize a página, navegue para Favoritos e confirme que continua conectado. Use Sair da conta e confirme que uma URL interna volta a pedir login.
5. Para o APK atualizado: entre, Android → Configurações → Apps → CineView → Forçar parada; abra pelo ícone e confirme acesso interno sem Login.

A validação real e as capturas de consentimento/Users dependem das credenciais Google e do acesso do titular aos painéis. Não foram substituídas por evidências simuladas.

Referências oficiais:
- https://supabase.com/docs/guides/auth/social-login/auth-google
- https://supabase.com/docs/guides/auth/redirect-urls
- https://capacitorjs.com/docs/apis/app
- https://capacitorjs.com/docs/apis/browser
