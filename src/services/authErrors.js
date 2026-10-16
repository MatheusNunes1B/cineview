// User-facing messages only: never expose responses, sessions or credentials.
export function authFormError(error, method) {
  const messages = {
    user_already_exists: 'Já existe uma conta com esse e-mail. Use Entrar.',
    email_exists: 'Já existe uma conta com esse e-mail. Use Entrar.',
    email_address_invalid: 'Confira o endereço de e-mail informado.',
    email_address_not_authorized: 'O envio de confirmação está restrito no servidor. O administrador precisa configurar o serviço de e-mail.',
    weak_password: 'Use uma senha mais forte, com pelo menos 8 caracteres, letras, números e símbolos.',
    signup_disabled: 'O cadastro de novas contas está desativado no servidor.',
    email_provider_disabled: 'O cadastro por e-mail está desativado no servidor.',
    over_email_send_rate_limit: 'O limite de e-mails de confirmação foi atingido. Aguarde antes de tentar novamente.',
    over_request_rate_limit: 'Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente.',
    email_not_confirmed: 'Confirme o cadastro pelo link recebido no seu e-mail antes de entrar.',
    invalid_credentials: 'E-mail ou senha incorretos. Se você já criou a conta, use os mesmos dados para entrar.',
    captcha_failed: 'O servidor exige uma verificação de segurança que não foi concluída. Avise o administrador.'
  };
  let message = messages[error?.code];
  if (!message && error?.name === 'AuthWeakPasswordError') message = messages.weak_password;
  if (!message && (error?.status === 429)) message = messages.over_request_rate_limit;
  if (!message && (error?.name === 'AuthRetryableFetchError' || error instanceof TypeError)) {
    message = 'Não foi possível conectar ao serviço de contas. Verifique a internet e tente novamente.';
  }
  if (!message && error?.status >= 500) message = 'O servidor não conseguiu concluir o cadastro ou login. Tente novamente mais tarde; se continuar, avise o administrador.';
  if (!message && ['signInWithOAuth', 'setSession'].includes(method)) message = 'Não foi possível concluir o login Google. Inicie uma nova tentativa pelo botão Entrar com Google.';
  const failure = new Error(message || (method === 'signUp'
    ? 'Não foi possível criar a conta. Confira o e-mail e a senha ou tente novamente mais tarde.'
    : 'Não foi possível entrar. Confira e-mail e senha ou tente novamente.'));
  failure.formError = true;
  return failure;
}
