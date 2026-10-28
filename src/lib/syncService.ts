import type { Aluno, Treino } from '@/lib/types';

const MASTER_OBJECT_ID = 'ff808181a09d98f701a1805e04722fb3';
const CLOUD_FALLBACK_URL = `https://api.restful-api.dev/objects/${MASTER_OBJECT_ID}`;

const SYNC_HEADERS = {
  'Accept': 'application/json',
  'User-Agent': 'Giano-Client-Sync/1.0',
};

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
  treinosAtivosDoAluno: Treino[] = []
): Promise<boolean> {
  return salvarAlunoNaNuvem(aluno, treinosAtivosDoAluno);
}

/**
 * Salva ou atualiza os dados completos de um aluno na nuvem
 */
export async function salvarAlunoNaNuvem(
  aluno: Aluno,
  treinosAtivosDoAluno: Treino[] = []
): Promise<boolean> {
  if (!aluno?.id) return false;

  const payload = {
    alunoId: aluno.id,
    aluno: {
      id: aluno.id,
      professor_id: aluno.professor_id,
      nome: aluno.nome,
      email: aluno.email || '',
      telefone: aluno.telefone || '',
      nascimento: aluno.nascimento || '',
      grupo: aluno.grupo || 'Geral',
      valor_mensalidade: aluno.valor_mensalidade || 0,
      dia_vencimento: aluno.dia_vencimento || 10,
      ativo: aluno.ativo ?? true,
      app_liberado: aluno.app_liberado ?? true,
      senha: aluno.senha || '',
      senha_alterada: aluno.senha_alterada ?? false,
      treinos_ids: aluno.treinos_ids || [],
      foto_url: aluno.foto_url,
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
    const respAtual = await fetch(CLOUD_FALLBACK_URL, { headers: SYNC_HEADERS });
    if (respAtual.ok) {
      const data = await respAtual.json();
      registroAtual = data?.data?.alunos || {};
    }

    const existente = registroAtual[aluno.id] || {};
    registroAtual[aluno.id] = {
      ...existente,
      ...payload,
      aluno: {
        ...(existente.aluno || {}),
        ...payload.aluno,
      },
      updatedAt: new Date().toISOString(),
    };

    const respSave = await fetch(CLOUD_FALLBACK_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...SYNC_HEADERS,
      },
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
 * Sincroniza uma lista inteira de alunos para a nuvem
 */
export async function sincronizarLoteAlunos(listaAlunos: Aluno[]): Promise<boolean> {
  if (!Array.isArray(listaAlunos) || listaAlunos.length === 0) return true;

  // 1. Tenta endpoint da Vercel
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listaAlunos }),
    });
    if (res.ok) {
      return true;
    }
  } catch {}

  // 2. Fallback direto
  try {
    let registroAtual: Record<string, any> = {};
    const respAtual = await fetch(CLOUD_FALLBACK_URL, { headers: SYNC_HEADERS });
    if (respAtual.ok) {
      const data = await respAtual.json();
      registroAtual = data?.data?.alunos || {};
    }

    listaAlunos.forEach((al) => {
      if (!al?.id) return;
      const existente = registroAtual[al.id] || {};
      registroAtual[al.id] = {
        ...existente,
        alunoId: al.id,
        aluno: {
          ...(existente.aluno || {}),
          ...al,
        },
        treinos_ids: al.treinos_ids || existente.treinos_ids || [],
        treinos: existente.treinos || [],
        updatedAt: new Date().toISOString(),
      };
    });

    const respSave = await fetch(CLOUD_FALLBACK_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...SYNC_HEADERS,
      },
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
    console.warn('Erro ao sincronizar lote na nuvem:', e);
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
    const res = await fetch(CLOUD_FALLBACK_URL, { headers: SYNC_HEADERS });
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

/**
 * Busca na nuvem um aluno pelo seu e-mail ou número de telefone/WhatsApp
 */
export async function buscarAlunoPorIdentificadorNaNuvem(
  identificador: string
): Promise<Aluno | null> {
  const limpo = (identificador || '').trim().toLowerCase();
  if (!limpo) return null;
  const digits = limpo.replace(/\D/g, '');

  const extrairAluno = (registro: Record<string, any>): Aluno | null => {
    const item = Object.values(registro).find((entry: any) => {
      const al = entry?.aluno || entry;
      if (!al) return false;
      if (al.id === limpo) return true;
      const alEmail = (al.email || '').toLowerCase().trim();
      if (alEmail && alEmail === limpo) return true;
      const alTel = (al.telefone || '').replace(/\D/g, '');
      if (digits && digits.length >= 4 && alTel.endsWith(digits)) return true;
      return false;
    });

    if (item) {
      const al = item.aluno || item;
      return {
        id: al.id,
        professor_id: al.professor_id || '8e90e5b0-ac3a-4812-ad25-6a4ff6c40b8d',
        nome: al.nome || 'Aluno',
        email: al.email || '',
        telefone: al.telefone || '',
        nascimento: al.nascimento || '01/01/2000',
        grupo: al.grupo || 'Geral',
        valor_mensalidade: al.valor_mensalidade || 0,
        dia_vencimento: al.dia_vencimento || 10,
        ativo: al.ativo ?? true,
        app_liberado: al.app_liberado ?? true,
        senha: al.senha || '',
        senha_alterada: al.senha_alterada ?? false,
        treinos_ids: item.treinos_ids || al.treinos_ids || [],
        created_at: al.created_at || new Date().toISOString(),
        foto_url: al.foto_url,
      };
    }
    return null;
  };

  // 1. Tenta endpoint da Vercel
  try {
    const res = await fetch(`/api/sync?identificador=${encodeURIComponent(limpo)}`);
    if (res.ok) {
      const json = await res.json();
      if (json?.alunoData) {
        const al = json.alunoData.aluno || json.alunoData;
        return {
          id: al.id,
          professor_id: al.professor_id || '8e90e5b0-ac3a-4812-ad25-6a4ff6c40b8d',
          nome: al.nome || 'Aluno',
          email: al.email || '',
          telefone: al.telefone || '',
          nascimento: al.nascimento || '01/01/2000',
          grupo: al.grupo || 'Geral',
          valor_mensalidade: al.valor_mensalidade || 0,
          dia_vencimento: al.dia_vencimento || 10,
          ativo: al.ativo ?? true,
          app_liberado: al.app_liberado ?? true,
          senha: al.senha || '',
          senha_alterada: al.senha_alterada ?? false,
          treinos_ids: json.alunoData.treinos_ids || al.treinos_ids || [],
          created_at: al.created_at || new Date().toISOString(),
          foto_url: al.foto_url,
        };
      }
    }
  } catch {}

  // 2. Fallback direto de alta resiliência
  try {
    const res = await fetch(CLOUD_FALLBACK_URL, { headers: SYNC_HEADERS });
    if (res.ok) {
      const json = await respToJson(res);
      const registro = json?.data?.alunos || {};
      const encontrado = extrairAluno(registro);
      if (encontrado) return encontrado;
    }
  } catch (e) {
    console.warn('Erro ao consultar identificador na nuvem:', e);
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
