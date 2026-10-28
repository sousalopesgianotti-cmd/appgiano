import type { Aluno, Treino } from '@/lib/types';

/**
 * Gera um link de convite limpo, curto e elegante para o aluno.
 * Exemplo: https://www.appgiano.com.br/app?alunoId=6e81009c...&n=Maria&s=6156
 */
export function gerarLinkConvite(origin: string, aluno: Aluno, _treinosDisponiveis: Treino[] = []): string {
  const primeiroNome = aluno.nome.trim().split(' ')[0] || aluno.nome.trim();
  const telDigits = aluno.telefone.replace(/\D/g, '');
  const senhaProvisoria = (aluno.senha && aluno.senha.trim())
    ? aluno.senha.trim()
    : (telDigits.slice(-4) || '1234');

  const params = new URLSearchParams();
  params.set('alunoId', aluno.id);
  params.set('n', primeiroNome);
  params.set('s', senhaProvisoria);
  if (aluno.email) {
    params.set('e', aluno.email.trim().toLowerCase());
  }
  if (aluno.telefone) {
    params.set('p', aluno.telefone.replace(/\D/g, ''));
  }
  if (aluno.treinos_ids && aluno.treinos_ids.length > 0) {
    params.set('t', aluno.treinos_ids.join(','));
  }

  return `${origin}/app?${params.toString()}`;
}

/**
 * Retorna o link apropriado para o aluno:
 * - Se o aluno já alterou sua senha / fez primeiro acesso: retorna o link definitivo oficial do app `${origin}/app`
 * - Se for novo aluno ainda sem senha alterada: retorna o link de convite provisório.
 */
export function gerarLinkAcessoAluno(origin: string, aluno: Aluno, treinos: Treino[] = []): string {
  if (aluno.senha_alterada) {
    return `${origin}/app`;
  }
  return gerarLinkConvite(origin, aluno, treinos);
}

/**
 * Gera o texto pronto e formatado para envio no WhatsApp do aluno:
 * - Se já fez primeiro acesso: mensagem limpa com link definitivo do app e dica de PWA (fixar na tela inicial).
 * - Se for novo: mensagem de convite com senha provisória e instruções de primeiro acesso.
 */
export function gerarMensagemWhatsAppAluno(
  origin: string,
  aluno: Aluno,
  treinos: Treino[] = []
): { texto: string; link: string; isRecorrente: boolean } {
  const primeiroNome = aluno.nome.trim().split(' ')[0] || aluno.nome.trim();

  if (aluno.senha_alterada) {
    const link = `${origin}/app`;
    const texto = `Olá, ${primeiroNome}! 💪\n\nAqui está o link de acesso aos seus treinos no App Giano:\n👉 ${link}\n\n📱 Acesse com seu e-mail/WhatsApp e sua senha cadastrada.\n\n💡 *Dica:* Para abrir o app com 1 toque como um aplicativo, abra o link no seu navegador (Safari ou Chrome), toque em *Compartilhar* e selecione *"Adicionar à Tela de Início"*! 🔥`;
    return { texto, link, isRecorrente: true };
  }

  const link = gerarLinkConvite(origin, aluno, treinos);
  const telDigits = aluno.telefone.replace(/\D/g, '');
  const senhaProvisoria = (aluno.senha && aluno.senha.trim())
    ? aluno.senha.trim()
    : (telDigits.slice(-4) || '1234');

  const texto = `Olá, ${primeiroNome}! Seu acesso ao aplicativo do *Personal Academy* está liberado. 💪🏋️‍♂️\n\nAbra o link abaixo para visualizar sua rotina de treinos:\nSua senha inicial provisória é: *${senhaProvisoria}*\n\n👉 ${link}\n\n💡 Ao entrar, você poderá cadastrar sua senha pessoal definitiva!`;
  return { texto, link, isRecorrente: false };
}

/**
 * Extrai os dados do aluno a partir dos parâmetros simples da URL (se o aluno ainda não existir localmente no aparelho)
 */
export function extrairAlunoDoLink(searchParams: URLSearchParams): Aluno | null {
  const id = searchParams.get('alunoId') || searchParams.get('id');
  if (!id) return null;

  const nome = searchParams.get('n') || searchParams.get('nome') || 'Aluno';
  const senha = searchParams.get('s') || searchParams.get('senha') || '';
  const email = searchParams.get('e') || searchParams.get('email') || '';
  const telefone = searchParams.get('p') || searchParams.get('telefone') || searchParams.get('tel') || (senha ? `1199999${senha}` : '');
  const treinosStr = searchParams.get('t') || '';
  const treinos_ids = treinosStr ? treinosStr.split(',').filter(Boolean) : [];

  return {
    id,
    professor_id: '8e90e5b0-ac3a-4812-ad25-6a4ff6c40b8d',
    nome,
    email,
    telefone,
    nascimento: '01/01/2000',
    grupo: 'Geral',
    valor_mensalidade: 0,
    dia_vencimento: 10,
    ativo: true,
    app_liberado: true,
    senha,
    treinos_ids,
    created_at: new Date().toISOString(),
  };
}
