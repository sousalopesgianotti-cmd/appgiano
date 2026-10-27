import type { Aluno, Treino } from '@/lib/types';

export interface ConvitePayload {
  aluno: Aluno;
  treinos?: Treino[];
  criadoEm: string;
}

/**
 * Codifica de forma segura para URL os dados do aluno e seus treinos vinculados.
 * Suporta caracteres UTF-8 (acentos, emojis, etc.).
 */
export function codificarConvite(aluno: Aluno, treinosAluno: Treino[] = []): string {
  const payload: ConvitePayload = {
    aluno: {
      ...aluno,
      treinos_ids: aluno.treinos_ids || [],
    },
    treinos: treinosAluno.length > 0 ? treinosAluno : undefined,
    criadoEm: new Date().toISOString(),
  };

  try {
    const jsonStr = JSON.stringify(payload);
    // Codificação UTF-8 compatível com Base64
    const utf8Bytes = encodeURIComponent(jsonStr);
    const base64 = btoa(utf8Bytes);
    // Transforma em base64 URL-safe
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (err) {
    console.error('Falha ao codificar convite:', err);
    return '';
  }
}

/**
 * Decodifica o payload do convite a partir da URL.
 */
export function decodificarConvite(token: string): ConvitePayload | null {
  try {
    if (!token) return null;
    // Reverte URL-safe base64 para standard base64
    let base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const utf8Bytes = atob(base64);
    const jsonStr = decodeURIComponent(utf8Bytes);
    const parsed = JSON.parse(jsonStr) as ConvitePayload;

    if (parsed && parsed.aluno && parsed.aluno.id && parsed.aluno.nome) {
      return parsed;
    }
  } catch (err) {
    console.warn('Falha ao decodificar convite da URL:', err);
  }
  return null;
}

/**
 * Gera o link completo de convite para compartilhar no WhatsApp ou copiar.
 */
export function gerarLinkConvite(origin: string, aluno: Aluno, treinosDisponiveis: Treino[] = []): string {
  const treinosAluno = (aluno.treinos_ids || [])
    .map((id) => treinosDisponiveis.find((t) => t.id === id))
    .filter((t): t is Treino => Boolean(t));

  const token = codificarConvite(aluno, treinosAluno);
  if (token) {
    return `${origin}/app?c=${token}&alunoId=${aluno.id}`;
  }
  return `${origin}/app?alunoId=${aluno.id}`;
}
