# Especificação Técnica: Aposentadoria do Card de Convite e Login Definitivo Pré-carregado

## 1. Problema e Diagnóstico
- **Comportamento Anterior**: Após a aluna/aluno acessar o aplicativo pelo link de convite e definir sua senha pessoal, ao tocar em *"Sair da Conta"*, o App voltava a exibir o card de convite com a mensagem *"Convite de Acesso - Senha de Acesso Provisória (4 últimos dígitos do WhatsApp)"*.
- **Impacto**: O usuário era induzido a digitar a senha provisória em vez de sua nova senha definitiva, gerando retrabalho e confusão.

---

## 2. Decisão Arquitetural Registrada (Decision Log)

| Decisão | Alternativa Descartada | Justificativa |
|---|---|---|
| **Aposentar o card de convite após primeiro acesso/troca de senha e apresentar login definitivo pré-preenchido** | Manter o convite para sempre enquanto o parâmetro da URL existisse | Garante a usabilidade correta de um aplicativo, onde o primeiro acesso é temporário e todos os acessos seguintes utilizam as credenciais definitivas do usuário. |
| **Persistir `giano_convite_usado_{id}` e `giano_ultimo_identificador`** | Deixar os campos em branco a cada logout | Proporciona excelente experiência de uso, poupando o atleta de ter que redigitar seu e-mail/WhatsApp toda vez que deslogar. |

---

## 3. Especificação da Implementação em `src/pages/aluno/AppAlunoPage.tsx`
1. Verificação de status do convite:
   - Se `alunoConvidado.senha_alterada === true` ou `giano_convite_usado_{id} === 'true'`, o card de convite não é mais renderizado.
2. No `handleLogout`:
   - Grava `localStorage.setItem('giano_convite_usado_' + alunoLogado.id, 'true')`.
   - Grava `localStorage.setItem('giano_ultimo_identificador', alunoLogado.email || alunoLogado.telefone)`.
   - Atualiza `setIdentificadorLogin(alunoLogado.email || alunoLogado.telefone)`.
   - Limpa `alunoLogado` e `alunoPendente`.
3. Na tela de login definitiva:
   - Apresenta o card com o identificador pré-carregado e o campo de senha pronto para preenchimento de credenciais salvas pelo navegador / Face ID.
