# Especificação Técnica: Sincronização em Nuvem em Tempo Real (PC do Professor <-> Celular do Aluno)

## 1. Problema Resolvido
- **Diagnóstico**: O painel de gestão executado no computador do professor gravava alunos e treinos exclusivamente no `localStorage` daquele navegador. O celular da aluna (iPhone) possuía seu próprio `localStorage` independente.
- **Sintoma Visual**: No PC, o treino *"Maria José Corpo Total"* (12 exercícios) aparecia ativo e liberado com chave seletora ligada. No celular da aluna, aparecia a mensagem *"Seu personal trainer está preparando sua rotina..."* e o botão *"Falar com meu Personal no WhatsApp"*, pois os treinos não chegavam ao smartphone.

---

## 2. Decisões Arquiteturais Registradas (Decision Log)

| Decisão | Alternativa Descartada | Justificativa |
|---|---|---|
| **API Serverless Vercel (`/api/sync`) com Nuvem Persistente** | Configuração manual de bancos externos | Atende à exigência do usuário de zero configuração externa; funciona imediatamente na infraestrutura existente da Vercel. |
| **Sincronização Reativa no Toggle Switch** | Envio manual de novos links via WhatsApp | Permite que o treino apareça de forma 100% automática e silenciosa no celular assim que a chave for ativada pelo professor. |
| **Pooling Inteligente na Tela de Espera** | Exigir que a aluna feche e reabra o app | Detecta a liberação do treino em tempo real mesmo se a aluna já estiver com a tela de espera aberta no celular. |
| **Cache Local Resiliente** | Dependência exclusiva de internet contínua | Garante que a aluna possa realizar o treino completo em academias subterrâneas ou sem cobertura de rede móvel. |

---

## 3. Especificação dos Componentes

### 3.1 Endpoint Serverless: `api/sync.ts`
- **POST `/api/sync`**:
  - Parâmetros: `{ alunoId: string, aluno: Aluno, treinos: Treino[] }`
  - Ação: Grava a ficha completa e lista de treinos associados ao `alunoId` na nuvem persistente.
  - Retorno: `{ ok: true, syncedAt: string }`
- **GET `/api/sync?alunoId=<id>`**:
  - Retorno: `{ ok: true, aluno: Aluno, treinos: Treino[], syncedAt: string }`

### 3.2 Cliente de Sincronização: `src/lib/syncService.ts`
- Funções utilitárias:
  - `enviarTreinosParaNuvem(aluno: Aluno, treinos: Treino[]): Promise<boolean>`
  - `buscarTreinosDaNuvem(alunoId: string): Promise<{ aluno?: Aluno; treinos: Treino[] } | null>`

### 3.3 Integração no Painel do Professor: `src/components/treinos/TreinosAlunoNexurView.tsx` & `src/App.tsx`
- Ao ativar ou desativar uma ficha de treino para o aluno:
  - Disparar `enviarTreinosParaNuvem(alunoAtualizado, treinosAtivos)`.
- Ao salvar alterações no construtor de treinos (adicionar exercício, editar séries/repetições/tempo):
  - Disparar a sincronização imediata.

### 3.4 Integração no App do Aluno: `src/pages/aluno/AppAlunoPage.tsx`
- No efeito de montagem e quando o aluno estiver autenticado:
  - Executar `buscarTreinosDaNuvem(alunoLogado.id)`.
  - Se treinos forem retornados, atualizar a lista local de treinos e o aluno logado.
  - Se a aluna estiver na tela vazia (0 treinos), ativar um timer periódico de verificação (ex: a cada 4 segundos) para detectar a liberação imediata feita pelo professor.

---

## 4. Critérios de Aceite e Verificação
1. O professor liga o switch de "Maria José Corpo Total" no painel do PC.
2. No celular da Maria, a tela de espera com o botão do WhatsApp desaparece automaticamente.
3. O card do treino "Maria José Corpo Total" é exibido com os 12 exercícios e cronômetro prontos para uso.
4. Ao fechar e reabrir o app no celular, o treino continua visível e acessível mesmo se a internet oscilar.
