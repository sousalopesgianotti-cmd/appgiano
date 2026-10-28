# Especificação Técnica: Sincronização em Nuvem e Autenticação Global de Alunos

## 1. Contexto e Problema
- Quando o personal trainer cadastra um aluno no painel (`ClientesPage`), o cadastro era salvo apenas no `localStorage` do dispositivo do professor.
- Ao abrir o aplicativo em outro dispositivo (ex: iPhone do aluno) e deslogar, a busca pelo e-mail (ex: `andre_lopes2003@yahoo.com.br`) falhava com a mensagem *"Aluno não encontrado. Verifique seu WhatsApp ou e-mail"*.
- O endpoint `/api/sync` na Vercel estava sendo interceptado pelo rewrite genérico `/(.*)` do SPA e não contava com os headers adequados de chamada externa.

## 2. Decisão de Arquitetura (Decision Log)

| Decisão | Escolha | Justificativa |
|---|---|---|
| **Abordagem de Sincronização** | Sincronização Automática Contínua (Nuvem + Cache Local) | Permite acesso imediato de qualquer dispositivo com e-mail/WhatsApp, mantendo velocidade e funcionamento offline. |
| **Persistência Central** | Repositório em Nuvem Giano com Fallback Direto | Garante resiliência mesmo se a rota serverless da Vercel sofrer timeout ou rate limit. |
| **Roteamento Vercel** | Priorização da rota `/api/(.*)` no `vercel.json` | Impede que requisições de API sejam redirecionadas para o HTML do SPA. |
| **Autenticação no App do Aluno** | Local-First com Busca Automática na Nuvem | Checa `localStorage`; se não achar, consulta a nuvem em tempo real e salva no cache do aparelho. |

---

## 3. Plano Incremental de Implementação

### Bloco 1: Roteamento e Endpoint de Sincronização
- Ajustar `vercel.json` para garantir que `/api/(.*)` vá direto para as serverless functions.
- Aperfeiçoar `api/sync.ts` e `src/lib/syncService.ts`:
  - Suportar sincronização de alunos completos (com e-mail, telefone, status e credenciais).
  - Incluir fallback direto de alta resiliência com headers adequados (`Accept: application/json`, `User-Agent`).
  - Função `sincronizarTodosAlunosParaNuvem` e `buscarAlunoPorIdentificadorNaNuvem`.

### Bloco 2: Disparo Automático no Painel do Personal (`App.tsx`)
- Ao inicializar a aplicação no painel do professor, sincronizar os alunos já existentes para a nuvem.
- Em `handleAddAluno` e `handleUpdateAluno`, acionar a sincronização em tempo real na nuvem.

### Bloco 3: Autenticação Resiliente no App do Atleta (`AppAlunoPage.tsx` e `LoginPage.tsx`)
- Em `handleLogin`:
  1. Busca no array local `alunos`.
  2. Busca no `localStorage` (`giano_alunos_db`).
  3. Se não encontrar pelo e-mail ou dígitos do telefone, consulta a nuvem via `buscarAlunoPorIdentificadorNaNuvem`.
  4. Ao encontrar na nuvem, adiciona o aluno no cache local do aparelho e no estado global, permitindo login imediato e persistência.
  5. Valida a senha (cadastrada ou provisória) e efetiva a entrada.

---

## 4. Verificação e Testes
- Build limpo com `npm run build`.
- Deploy na Vercel e validação com `curl`.
- Teste real com o e-mail `andre_lopes2003@yahoo.com.br`.
