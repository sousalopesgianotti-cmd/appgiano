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
  if (aluno.treinos_ids && aluno.treinos_ids.length > 0) {
    params.set('t', aluno.treinos_ids.join(','));
  }

  return `${origin}/app?${params.toString()}`;
}

/**
 * Extrai os dados do aluno a partir dos parâmetros simples da URL (se o aluno ainda não existir localmente no aparelho)
 */
export function extrairAlunoDoLink(searchParams: URLSearchParams): Aluno | null {
  const id = searchParams.get('alunoId') || searchParams.get('id');
  if (!id) return null;

  const nome = searchParams.get('n') || searchParams.get('nome') || 'Aluno';
  const senha = searchParams.get('s') || searchParams.get('senha') || '';
  const treinosStr = searchParams.get('t') || '';
  const treinos_ids = treinosStr ? treinosStr.split(',').filter(Boolean) : [];

  return {
    id,
    professor_id: '8e90e5b0-ac3a-4812-ad25-6a4ff6c40b8d',
    nome,
    email: '',
    telefone: senha ? `1199999${senha}` : '',
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
