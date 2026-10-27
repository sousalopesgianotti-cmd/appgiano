import type { VercelRequest, VercelResponse } from '@vercel/node';

const MASTER_OBJECT_ID = 'ff808181a09d98f701a17fb6b8612eed';
const CLOUD_STORE_URL = `https://api.restful-api.dev/objects/${MASTER_OBJECT_ID}`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET: Busca dados de treinos para um aluno específico ou geral
    if (req.method === 'GET') {
      const alunoId = (req.query.alunoId as string) || '';
      const resp = await fetch(CLOUD_STORE_URL);
      if (!resp.ok) {
        return res.status(resp.status).json({ error: 'Erro ao conectar à nuvem' });
      }
      const data = await resp.json();
      const registro = data?.data?.alunos || {};

      if (alunoId) {
        const alunoData = registro[alunoId] || null;
        return res.status(200).json({ ok: true, alunoData, syncedAt: data?.data?.updatedAt });
      }

      return res.status(200).json({ ok: true, alunos: registro, syncedAt: data?.data?.updatedAt });
    }

    // POST: Grava/atualiza treinos de um aluno liberados pelo professor
    if (req.method === 'POST') {
      const { alunoId, aluno, treinos_ids, treinos } = req.body || {};
      if (!alunoId) {
        return res.status(400).json({ error: 'alunoId é obrigatório' });
      }

      // Lê o estado atual
      let registroAtual: Record<string, any> = {};
      try {
        const respAtual = await fetch(CLOUD_STORE_URL);
        if (respAtual.ok) {
          const jsonAtual = await respAtual.json();
          registroAtual = jsonAtual?.data?.alunos || {};
        }
      } catch {}

      // Atualiza os dados deste aluno
      registroAtual[alunoId] = {
        alunoId,
        aluno,
        treinos_ids: treinos_ids || [],
        treinos: treinos || [],
        updatedAt: new Date().toISOString(),
      };

      // Persiste no repositório em nuvem
      const respSave = await fetch(CLOUD_STORE_URL, {
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

      if (!respSave.ok) {
        return res.status(respSave.status).json({ error: 'Falha ao salvar na nuvem' });
      }

      return res.status(200).json({ ok: true, syncedAt: new Date().toISOString() });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Erro interno de sincronização' });
  }
}
