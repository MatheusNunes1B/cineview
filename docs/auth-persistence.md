# Persistência da autenticação — Cineview

## Implementação

O estado de React e do SDK Supabase é volátil: desaparece quando o processo termina. O AuthProvider reconstrói session e user após ler a sessão persistida em Preferences, chave supabase_session, e validá-la com supabase.auth.setSession. Não confia no usuário gravado para autorizar coleções; usa o usuário retornado pelo Supabase.

A persistência automática do SDK foi desativada (persistSession: false). Preferences é o único armazenamento durável; SIGNED_IN e TOKEN_REFRESHED salvam JSON e SIGNED_OUT remove a chave. O SDK continua renovando tokens em memória. No Android o plugin usa SharedPreferences; na web, o fallback oficial usa localStorage. Preferences não é um cofre e não criptografa tokens. Não são armazenadas senhas. As políticas RLS são preservadas. O app respeita a configuração de confirmação de e-mail definida no servidor, sem alterá-la.

As operações de autenticação e as gravações são serializadas. Login, logout e navegação interna aguardam a persistência. Um timeout mostra erro e nova tentativa, mas não libera a fila de uma operação ainda pendente: assim seu resultado não sobrescreve um login/logout posterior. O callback onAuthStateChange é síncrono e não chama outros métodos de autenticação. Inicializações concorrentes compartilham o mesmo bootstrap.

JSON e JWT inválidos e tokens revogados são descartados. Falhas temporárias de rede e leitura preservam a sessão recuperável. Falhas de escrita/remoção ficam visíveis e podem ser repetidas. Sem Supabase configurado, a tela de Login informa a indisponibilidade; as telas internas não são liberadas.

A interface existente é montada após autenticação e coleções. Troca de usuário e logout apagam o cache privado e invalidam consultas/gravações antigas. Listeners, observadores, timers, animações e diálogo são removidos no cleanup. As seis páginas HTML passam pelo mesmo AuthProvider. Não há reload associado a login/logout.

Arquivos principais: src/services/authPersistence.js, auth.js, supabaseClient.js; src/contexts/AuthContext.jsx; src/App.jsx; www/js/main.jsx, account.js, storage.js, app.js, lifecycle.js. home.js, pages.js e search.js recebem o ciclo de vida comum. package.json, lockfile e arquivos Gradle gerados incluem Preferences 8.

## Configuração e validação

Use .env.local (ignorado pelo Git) com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY pública, anon ou publishable. O Vite rejeita chaves privadas no build. Não coloque credenciais pessoais em variáveis VITE_. O arquivo .env.example deve permanecer um modelo; valores locais do usuário não fazem parte desta entrega.

- npm test: testes de catálogo, isolamento de coleções, restauração, refresh, logout, JSON inválido, falhas de armazenamento/rede, timeout e concorrência.
- npm run test:browser: testes Playwright com Supabase simulado, SDK e Preferences web reais. Usa Edge no Windows; em Linux instale Chromium com npx playwright install chromium.
- npm run build: build Vite multipágina com assets relativos e saída dist.
- npm run android:sync: build e sincronização Capacitor.
- Android exige Java 21 e SDK 36. Compilação local: android/gradlew.bat -p android assembleDebug --no-daemon.
- APK: android/app/build/outputs/apk/debug/app-debug.apk. O workflow build-apk.yml também executa npm test e disponibiliza cineview-debug-apk por 14 dias.

Os testes automatizados de navegador usam dados fictícios, sem criar usuários no Supabase. Eles não comprovam encerramento de processo Android. Para isso é necessário instalar o APK e executar o roteiro abaixo com uma conta real confirmada. Uma atualização do site não atualiza o APK já instalado.

## Publicação existente

Projeto Cloudflare Pages atual: cineview-app; endereço: https://cineview-app.pages.dev; branch de produção: main. A inspeção da conta confirmou publicação direta (sem Git Provider). Portanto, push sozinho não publica esse endereço.

Build local: npm run build, com as duas variáveis públicas disponíveis. Upload: npx wrangler pages deploy dist --project-name cineview-app --branch main. Não enviar www ou a raiz do repositório. Conferir o status final na API/painel Cloudflare, version.json e os hashes dos assets servidos. O build gera version.json com o commit para essa conferência.

GitHub Pages é uma publicação separada, em https://matheusnunes1b.github.io/cineview/. Seus registros de sucesso não comprovam o deploy Cloudflare. O domínio antigo cineview-er5.pages.dev foi substituído, a pedido do usuário, após um bloqueio de segurança; trocar o domínio não resolve a análise do domínio antigo.

## Roteiro do vídeo / teste Android

1. Instale o novo APK. Faça login na tela inicial com uma conta válida e abra Minha conta.
2. Mostre o e-mail conectado; abra favoritos/lista e salve um título de teste.
3. Em Configurações do Android > Apps > CineView, use Forçar parada. Alternativa: adb shell am force-stop com.cineview.
4. Abra novamente pelo ícone (ou adb shell am start -n com.cineview/.MainActivity).
5. Mostre a mesma conta autenticada, sem digitar credenciais nem passar pelo formulário. Confira favoritos, lista e assistidos, inclusive navegando entre telas.
6. Faça logout, force a parada novamente e reabra: deve aparecer Entrar, sem coleções da conta anterior.

Não limpe dados nem desinstale como teste de encerramento; isso apaga a persistência. Não mostre senhas, tokens ou o conteúdo de Preferences na gravação.

Referências: https://capacitorjs.com/docs/apis/preferences e https://supabase.com/docs/reference/javascript/auth-onauthstatechange.

Compatibilidade Android: o timeout de rede usa AbortController e os listeners são removidos explicitamente, sem depender de AbortSignal.any/timeout ou da opção signal de addEventListener. loggingBehavior: none evita que o bridge Capacitor registre valores de Preferences (inclusive tokens) no console/logcat.
