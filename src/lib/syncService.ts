import type { Aluno, Treino } from '@/lib/types';

const MASTER_OBJECT_ID = 'ff808181a09d98f701a17fb6b8612eed';
const CLOUD_FALLBACK_URL = `https://api.restful-api.dev/objects/${MASTER_OBJECT_ID}`;

export type SincronizacaoAluno = {
  alunoId: string;
  aluno?: Partial<Aluno>;
  treinos_ids: string[];
  treinos: Treino[];
  updatedAt: string;
};

/**
 * Envia o aluno e seus treinos liberados para a nuvem em tempo real
 */
export async function enviarTreinosParaNuvem(
  aluno: Aluno,
  treinosAtivosDoAluno: Treino[]
): Promise<boolean> {
  if (!aluno?.id) return false;

  const payload = {
    alunoId: aluno.id,
    aluno: {
      id: aluno.id,
      nome: aluno.nome,
      email: aluno.email,
      telefone: aluno.telefone,
      treinos_ids: aluno.treinos_ids || [],
      ativo: aluno.ativo,
      app_liberado: aluno.app_liberado,
      senha: aluno.senha,
      senha_alterada: aluno.senha_alterada,
    },
    treinos_ids: aluno.treinos_ids || [],
    treinos: treinosAtivosDoAluno,
  };

  // 1. Tenta endpoint da Vercel /api/sync
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return true;
    }
  } catch {}

  // 2. Fallback direto de alta resiliência
  try {
    let registroAtual: Record<string, any> = {};
    const respAtual = await fetch(CLOUD_FALLBACK_URL);
    if (respAtual.ok) {
      const data = await respAtual.json();
      registroAtual = data?.data?.alunos || {};
    }

    registroAtual[aluno.id] = {
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    const respSave = await fetch(CLOUD_FALLBACK_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'GIANO_SYNC_REGISTRY',
        data: {
          updatedAt: new Date().toISOString(),
          alunos: registroAtual,
        },
      }),
    });

    return respSave.ok;
  } catch (e) {
    console.warn('Falha na sincronização em nuvem:', e);
    return false;
  }
}

/**
 * Busca da nuvem os treinos liberados para o aluno
 */
export async function buscarTreinosDaNuvem(
  alunoId: string
): Promise<SincronizacaoAluno | null> {
  if (!alunoId) return null;

  // 1. Tenta endpoint da Vercel /api/sync
  try {
    const res = await fetch(`/api/sync?alunoId=${encodeURIComponent(alunoId)}`);
    if (res.ok) {
      const json = await res.json();
      if (json?.alunoData) {
        return json.alunoData as SincronizacaoAluno;
      }
    }
  } catch {}

  // 2. Fallback direto
  try {
    const res = await fetch(CLOUD_FALLBACK_URL);
    if (res.ok) {
      const json = await respToJson(res);
      const registro = json?.data?.alunos || {};
      const alunoData = registro[alunoId];
      if (alunoData) {
        return alunoData as SincronizacaoAluno;
      }
    }
  } catch (e) {
    console.warn('Erro ao buscar dados na nuvem:', e);
  }

  return null;
}

async function respToJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
