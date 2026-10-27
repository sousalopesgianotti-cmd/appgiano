/**
 * Serviço de envio de e-mails transacionais (Resend API)
 * Suporte a domínio próprio (ex: registro.com / registro.br) e simulação em desenvolvimento
 */

export type DadosConviteAluno = {
  nome: string;
  email: string;
  telefone?: string;
  linkAcesso: string;
  senhaPadrao?: string;
  professorNome?: string;
};

export type ResultadoEnvioEmail = {
  sucesso: boolean;
  mensagem: string;
  modoSimulacao?: boolean;
};

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || '';
const EMAIL_FROM = import.meta.env.VITE_EMAIL_FROM || 'Personal Academy <onboarding@resend.dev>';

/**
 * Gera o template HTML do e-mail de boas-vindas e acesso ao app do aluno
 */
export function gerarHtmlEmailConvite({
  nome,
  linkAcesso,
  senhaPadrao,
  professorNome = 'Seu Personal Trainer',
}: Omit<DadosConviteAluno, 'email'>): string {
  const primeiroNome = nome.split(' ')[0] || nome;
  const infoSenha = senhaPadrao
    ? `<div style="background: #262626; border: 1px solid #404040; border-radius: 8px; padding: 14px; margin: 20px 0; text-align: left;">
         <p style="margin: 0; color: #a3a3a3; font-size: 13px;">Sua senha inicial de acesso:</p>
         <p style="margin: 4px 0 0; color: #f59e0b; font-size: 18px; font-weight: bold; letter-spacing: 2px;">${senhaPadrao}</p>
         <p style="margin: 6px 0 0; color: #737373; font-size: 11px;">(Padrão: 4 últimos dígitos do seu WhatsApp)</p>
       </div>`
    : '';

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Seu Treino Personalizado</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ededed;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0a0a0a; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="560px" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #171717; border: 1px solid #2e2e2e; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
              <!-- Top Bar Dourada -->
              <tr>
                <td height="4" style="background: linear-gradient(90deg, #f59e0b, #d97706);"></td>
              </tr>
              <!-- Conteúdo Principal -->
              <tr>
                <td style="padding: 36px 32px; text-align: center;">
                  <div style="display: inline-block; padding: 10px 18px; background-color: #262626; border-radius: 999px; margin-bottom: 20px;">
                    <span style="color: #f59e0b; font-size: 13px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">Personal Academy</span>
                  </div>
                  <h1 style="margin: 0 0 12px; font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">
                    Olá, ${primeiroNome}! 💪
                  </h1>
                  <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #a3a3a3;">
                    Seu cadastro foi realizado com sucesso por <strong style="color: #ffffff;">${professorNome}</strong>. Seu plano de treinos personalizado já está pronto no aplicativo.
                  </p>

                  ${infoSenha}

                  <!-- Botão de Acesso -->
                  <div style="margin: 32px 0 24px;">
                    <a href="${linkAcesso}" target="_blank" style="display: inline-block; background-color: #f59e0b; color: #0a0a0a; text-decoration: none; font-size: 15px; font-weight: 900; padding: 16px 36px; border-radius: 12px; box-shadow: 0 6px 20px rgba(245, 158, 11, 0.35); text-transform: uppercase; letter-spacing: 0.5px;">
                      Acessar Meu Treino Agora
                    </a>
                  </div>

                  <p style="margin: 0 0 8px; font-size: 12px; color: #737373;">
                    Se o botão acima não funcionar, copie e cole este link no seu navegador:
                  </p>
                  <p style="margin: 0; font-size: 12px; word-break: break-all;">
                    <a href="${linkAcesso}" style="color: #f59e0b; text-decoration: underline;">${linkAcesso}</a>
                  </p>
                </td>
              </tr>
              <!-- Rodapé -->
              <tr>
                <td style="background-color: #121212; border-top: 1px solid #262626; padding: 20px 32px; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #525252;">
                    © ${new Date().getFullYear()} Personal Academy. Treinos inteligentes e personalizados.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Envia o e-mail de convite ao aluno via Resend ou simula em ambiente de desenvolvimento
 */
export async function enviarEmailConviteAluno(dados: DadosConviteAluno): Promise<ResultadoEnvioEmail> {
  const { nome, email, linkAcesso, senhaPadrao, professorNome } = dados;

  // Se não houver chave de API configurada no ambiente local, simula com sucesso
  if (!RESEND_API_KEY || RESEND_API_KEY.includes('sua_chave') || RESEND_API_KEY === '') {
    console.group('📧 [Personal Academy - Simulação de E-mail de Convite]');
    console.log(`Para: ${nome} <${email}>`);
    console.log(`Link: ${linkAcesso}`);
    console.log(`Senha padrão: ${senhaPadrao || 'Sem senha explícita'}`);
    console.log('Ambiente: Modo de desenvolvimento local (Chave VITE_RESEND_API_KEY ausente ou placeholder)');
    console.groupEnd();

    // Simula delay de rede de 400ms para realismo na UI
    await new Promise((r) => setTimeout(r, 400));

    return {
      sucesso: true,
      mensagem: `Convite simulado com sucesso para ${email}.`,
      modoSimulacao: true,
    };
  }

  try {
    const html = gerarHtmlEmailConvite({ nome, linkAcesso, senhaPadrao, professorNome });
    const primeiroNome = nome.split(' ')[0] || nome;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [email],
        subject: `Bem-vindo(a) ao seu treino, ${primeiroNome}! Acesse seu aplicativo`,
        html,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errorMsg = errData.message || `Erro ${response.status} ao disparar e-mail`;
      console.error('[EmailService] Falha no envio via Resend:', errData);
      return {
        sucesso: false,
        mensagem: errorMsg,
      };
    }

    const resData = await response.json();
    return {
      sucesso: true,
      mensagem: `E-mail de convite enviado para ${email}.`,
    };
  } catch (error) {
    console.error('[EmailService] Exceção ao enviar e-mail:', error);
    return {
      sucesso: false,
      mensagem: error instanceof Error ? error.message : 'Falha na conexão com o serviço de e-mail.',
    };
  }
}
