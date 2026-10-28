# Especificação Técnica: Modal de Compartilhamento de Acesso e Reset de Senha do Aluno

## 1. Contexto e Motivação
- Ao clicar no botão de compartilhar de um aluno no painel do Personal Trainer, o sistema precisa permitir duas intenções distintas:
  1. **Enviar o Link Oficial do App** (`https://www.appgiano.com.br/app`): para alunos já cadastrados que já criaram sua senha, sem alterar nada em sua conta.
  2. **Reenviar Convite / Resetar Senha**: para novos alunos que ainda não ativaram a conta OU caso o professor deseje deliberadamente resetar a senha de um aluno já cadastrado para a provisória padrão (4 últimos dígitos do WhatsApp).
- Se o aluno já possui senha cadastrada, o sistema deve exigir confirmação explícita antes de resetar a senha.

---

## 2. Decisão de Arquitetura (Decision Log)

| Decisão | Escolha | Justificativa |
|---|---|---|
| **Componente de Compartilhamento** | Modal dedicado `ModalCompartilharAcessoAluno` | Proporciona clareza visual, espaço para avisos de confirmação e ações completas (WhatsApp e Copiar). |
| **Identificação do Status** | Verificação Híbrida (Nuvem + Local) | Garante que o painel do professor saiba se o aluno já definiu senha no seu celular. |
| **Opção 1: Link Oficial do App** | `https://www.appgiano.com.br/app` | Link limpo e definitivo que preserva 100% das credenciais do aluno e inclui mensagem de WhatsApp com dica de PWA. |
| **Opção 2: Reset com Confirmação** | Confirmação em 2 etapas com alerta de reset | Impede que o professor resete acidentalmente a senha pessoal de um aluno que já está ativo. |
| **Persistência Imediata** | `salvarAlunoNaNuvem` + `onUpdateAluno` | Qualquer reset atualiza imediatamente o banco na nuvem Giano e o `localStorage`. |

---

## 3. Plano Incremental de Implementação

### Bloco 1: Criação do `ModalCompartilharAcessoAluno.tsx`
- Componente em `src/components/common/ModalCompartilharAcessoAluno.tsx`:
  - Recebe: `isOpen`, `onClose`, `aluno`, `treinos`, `onUpdateAluno`.
  - Exibe identificação e status visual do aluno:
    - 🟢 *Aluno com Senha Pessoal Cadastrada*
    - 🟡 *Aguardando Primeiro Acesso*
  - **Card 1 (Link Oficial do App):** Link `https://www.appgiano.com.br/app`, botão copiar e botão enviar WhatsApp com instruções de login e tela de início.
  - **Card 2 (Reenviar Convite / Reset de Senha):**
    - Se aluno com senha: alerta com botão *"Confirmar Reset e Gerar Convite"*. Ao confirmar, atualiza `senha = 4 últimos dígitos do WhatsApp`, `senha_alterada = false` e sincroniza.
    - Se aluno novo: botões diretos de copiar/enviar convite com senha provisória.

### Bloco 2: Integração no Painel do Personal (`ClientesPage.tsx`)
- Substituir a chamada simples de `copiarLinkApp` pelo disparo do novo `ModalCompartilharAcessoAluno`.
- Manter suporte na visualização em tabela e na visualização em cards.

---

## 4. Verificação e Testes
- Build limpo com `npm run build`.
- Teste prático do fluxo com aluna Joana (`senha_alterada = false` ou com senha cadastrada).
- Deploy na Vercel e validação em produção.
