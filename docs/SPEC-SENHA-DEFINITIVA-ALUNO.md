# Especificação Técnica: Sincronização e Resiliência da Senha Pessoal do Aluno

## 1. Contexto do Problema
- Na primeira sessão após o convite, o aluno cadastrou sua senha pessoal (armazenada nas Chaves do iCloud / Face ID).
- No entanto, a alteração de senha (`handleSalvarNovaSenha`) gravava apenas no estado local e não disparava a persistência para a nuvem.
- Na nuvem e no código base, o aluno estava registrado com uma senha provisória padrão (`'2003'`).
- Ao deslogar e tentar entrar novamente com a senha pessoal preenchida pelo Safari/Face ID, o sistema comparava a senha digitada com a provisória `'2003'`, resultando no erro *"Senha incorreta"*.

---

## 2. Decisão de Arquitetura (Decision Log)

| Decisão | Escolha | Justificativa |
|---|---|---|
| **Prioridade de Credencial** | Senha Pessoal Definida > Senha Local > Provisória WhatsApp | Respeita a senha que o aluno escolheu e que está gravada nas Chaves do iCloud / Face ID. |
| **Sincronização em Nuvem na Troca de Senha** | Chamada direta a `salvarAlunoNaNuvem` em `handleSalvarNovaSenha` | Garante que no mesmo milissegundo em que a senha é alterada, a nuvem receba a atualização. |
| **Validação de Senha em `handleLogin`** | Validação Híbrida Multi-fonte | Aceita a senha pessoal da nuvem, a senha pessoal do cache local do aparelho, ou os 4 dígitos do WhatsApp caso ainda não tenha sido alterada. |
| **Recuperação de Acesso** | Botão "Esqueci minha senha" / Redefinição via WhatsApp | Previne bloqueios de alunos que esquecerem suas credenciais. |

---

## 3. Plano Incremental de Execução

### Bloco 1: Sincronização Direta da Nova Senha na Nuvem
- Em `handleSalvarNovaSenha` (`src/pages/aluno/AppAlunoPage.tsx`):
  - Chamar `salvarAlunoNaNuvem(alunoAtualizado)` diretamente com `senha: novaSenhaFinal` e `senha_alterada: true`.
  - Atualizar o `localStorage` (`giano_alunos_db`).

### Bloco 2: Validação Híbrida e Inteligente no Login
- Em `handleLogin` (`src/pages/aluno/AppAlunoPage.tsx` e `src/pages/auth/LoginPage.tsx`):
  - Consultar dados locais no `localStorage` antes de validar.
  - Se houver senha pessoal salva no aparelho (`alunoLocal.senha_alterada`), respeitá-la e sincronizá-la imediatamente para a nuvem.
  - Validar contra:
    1. Senha definitiva do perfil (`match.senha`).
    2. Senha do perfil local (`alunoLocal?.senha`).
    3. 4 últimos dígitos do WhatsApp como salvaguarda de segurança.

### Bloco 3: Modal de Redefinição de Senha e Ajuste da Base
- Adicionar modal rápido de "Esqueceu sua senha / Redefinir" na Área do Atleta.
- Atualizar a base de dados em nuvem para que a conta de André Lopes aceite tanto a senha pessoal quanto a provisória.

---

## 4. Verificação
- `npm run build` limpo.
- Teste de login na nuvem e deploy na Vercel.
