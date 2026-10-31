import type { VercelRequest, VercelResponse } from '@vercel/node';

const MASTER_OBJECT_ID = 'ff808181a09d98f701a1805e04722fb3';
const CLOUD_STORE_URL = `https://api.restful-api.dev/objects/${MASTER_OBJECT_ID}`;

const CLOUD_HEADERS = {
  'Accept': 'application/json',
  'User-Agent': 'Giano-Vercel-Sync/1.0',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // DELETE ou POST action=delete: Purgar aluno definitivamente da nuvem
    if (req.method === 'DELETE' || (req.method === 'POST' && req.body?.action === 'delete')) {
      const alunoId = (req.query.alunoId as string) || req.body?.alunoId || '';
      if (!alunoId) {
        return res.status(400).json({ error: 'alunoId é obrigatório para exclusão' });
      }

      let registroAtual: Record<string, any> = {};
      try {
        const respAtual = await fetch(CLOUD_STORE_URL, { headers: CLOUD_HEADERS });
        if (respAtual.ok) {
          const jsonAtual = await respAtual.json();
          registroAtual = jsonAtual?.data?.alunos || {};
        }
      } catch (err: any) {
        console.warn('Erro ao conectar ao storage para exclusão:', err);
      }

      if (registroAtual[alunoId]) {
        delete registroAtual[alunoId];
      }

      const respSave = await fetch(CLOUD_STORE_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...CLOUD_HEADERS,
        },
        body: JSON.stringify({
          name: 'GIANO_SYNC_REGISTRY',
          data: {
            updatedAt: new Date().toISOString(),
            alunos: registroAtual,
          },
        }),
      });

      if (!respSave.ok) {
        return res.status(500).json({ ok: false, error: 'Falha ao salvar no storage após exclusão' });
      }

      return res.status(200).json({ ok: true, deletedAlunoId: alunoId, purgedAt: new Date().toISOString() });
    }

    // GET: Busca dados de treinos ou alunos da nuvem
    if (req.method === 'GET') {
      const alunoId = (req.query.alunoId as string) || '';
      const identificador = ((req.query.identificador as string) || '').trim().toLowerCase();
      const digits = identificador.replace(/\D/g, '');

      let registro: Record<string, any> = {};
      try {
        const resp = await fetch(CLOUD_STORE_URL, { headers: CLOUD_HEADERS });
        if (resp.ok) {
          const data = await resp.json();
          registro = data?.data?.alunos || {};
        }
      } catch (err: any) {
        console.warn('Erro ao conectar ao storage:', err);
      }

      if (alunoId) {
        const alunoData = registro[alunoId] || null;
        return res.status(200).json({ ok: true, alunoData });
      }

      if (identificador) {
        const matchItem = Object.values(registro).find((item: any) => {
          const al = item.aluno || item;
          if (al.id === identificador) return true;
          const alEmail = (al.email || '').toLowerCase().trim();
          if (alEmail && alEmail === identificador) return true;
          const alTel = (al.telefone || '').replace(/\D/g, '');
          if (digits && digits.length >= 4 && alTel.endsWith(digits)) return true;
          return false;
        });

        return res.status(200).json({ ok: true, alunoData: matchItem || null });
      }

      return res.status(200).json({ ok: true, alunos: registro });
    }

    // POST: Grava/atualiza alunos ou treinos na nuvem
    if (req.method === 'POST') {
      const { alunoId, aluno, treinos_ids, treinos, listaAlunos } = req.body || {};

      // Lê o estado atual
      let registroAtual: Record<string, any> = {};
      try {
        const respAtual = await fetch(CLOUD_STORE_URL, { headers: CLOUD_HEADERS });
        if (respAtual.ok) {
          const jsonAtual = await respAtual.json();
          registroAtual = jsonAtual?.data?.alunos || {};
        }
      } catch {}

      // Caso 1: Sincronização em lote (array de alunos)
      if (Array.isArray(listaAlunos) && listaAlunos.length > 0) {
        listaAlunos.forEach((al: any) => {
          if (!al || !al.id) return;
          const existente = registroAtual[al.id] || {};
          registroAtual[al.id] = {
            ...existente,
            alunoId: al.id,
            aluno: {
              ...(existente.aluno || {}),
              ...al,
              senha: al.senha || existente.aluno?.senha || '',
              senha_alterada: al.senha_alterada ?? existente.aluno?.senha_alterada ?? false,
            },
            treinos_ids: al.treinos_ids || existente.treinos_ids || [],
            treinos: existente.treinos || [],
            updatedAt: new Date().toISOString(),
          };
        });
      }

      // Caso 2: Sincronização individual de um aluno
      if (alunoId && aluno) {
        const existente = registroAtual[alunoId] || {};
        registroAtual[alunoId] = {
          ...existente,
          alunoId,
          aluno: {
            ...(existente.aluno || {}),
            ...aluno,
            senha: aluno.senha || existente.aluno?.senha || '',
            senha_alterada: aluno.senha_alterada ?? existente.aluno?.senha_alterada ?? false,
          },
          treinos_ids: treinos_ids || aluno.treinos_ids || existente.treinos_ids || [],
          treinos: treinos || existente.treinos || [],
          updatedAt: new Date().toISOString(),
        };
      }

      // Persiste no repositório em nuvem
      const respSave = await fetch(CLOUD_STORE_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...CLOUD_HEADERS,
        },
        body: JSON.stringify({
          name: 'GIANO_SYNC_REGISTRY',
          data: {
            updatedAt: new Date().toISOString(),
            alunos: registroAtual,
          },
        }),
      });

      if (!respSave.ok) {
        return res.status(200).json({ ok: false, warning: 'Falha ao persistir no storage', registro: registroAtual });
      }

      return res.status(200).json({ ok: true, syncedAt: new Date().toISOString() });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Erro interno de sincronização' });
  }
}
