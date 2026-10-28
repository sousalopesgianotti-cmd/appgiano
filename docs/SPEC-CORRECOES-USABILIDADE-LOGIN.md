# Especificação Técnica: Correções de Usabilidade, Responsividade e Autenticação Definitiva da Aluna

## 1. Problemas e Causas Raízes Diagnosticados (Relatório de Usabilidade)

### CORREÇÃO 1: Botão "Concluir" no Cadastro de Aluno
- **Causa**: Após clicar em *"Cadastrar Aluno"*, o sistema abria o `ModalConviteAluno` contendo um botão *"Concluir"* no rodapé. O usuário acreditava que o cadastro exigia uma segunda confirmação, gerando confusão.
- **Solução**: Remoção definitiva do botão *"Concluir"*. O cadastro é 100% finalizado no clique de *"Cadastrar Aluno"*, e a tela seguinte mantém apenas as opções de compartilhamento e o botão *"X"* no topo para fechamento.

### CORREÇÃO 2: Falta de Responsividade e Rolagem Horizontal no iPhone
- **Causa**: A viewport no `index.html` permitia zoom e enquadramento dinâmico (`width=device-width, initial-scale=1.0`), e faltava contenção estrita de transbordamento (`overflow-x: hidden`) no HTML/CSS e nos containers do `AppAlunoPage.tsx`. O usuário no iPhone precisava rolar lateralmente para enquadrar a tela.
- **Solução**:
  - Meta tag de viewport para Web App: `viewport-fit=cover, maximum-scale=1.0, user-scalable=no`.
  - CSS global com `overflow-x: hidden; width: 100%; max-width: 100vw;`.
  - Container do `AppAlunoPage.tsx` com `w-full max-w-md mx-auto overflow-x-hidden touch-pan-y`.

### CORREÇÃO 3 (ERRO CRÍTICO): Aluna Não Reconhecida ao Deslogar
- **Causa**:
  1. O link de convite anterior só passava `alunoId`, `n` e `s`, sem passar `email` ou `telefone`. O celular criava a aluna com `email: ''` e telefone fictício.
  2. Ao clicar em *"Sair da Conta"*, o `handleLogout` chamava `window.history.pushState({}, '', '/')`, redirecionando a aluna para a tela de login administrativa do professor.
  3. Ao digitar `zezemoreira2001@hotmail.com`, a página não localizava a aluna porque o e-mail dela não existia naquele navegador, disparando o erro *"Usuário não encontrado"*.
- **Solução**:
  1. O link agora transporta o e-mail real e o telefone real da aluna (`e=...&p=...`).
  2. Ao deslogar no celular, a rota `/app` é rigorosamente mantida (sem redirecionar para a raiz `/`).
  3. O login (tanto em `/app` quanto na raiz `/`) passa a consultar tanto o banco local quanto a API em nuvem `/api/sync` caso o e-mail não esteja em cache local, autenticando a aluna de forma definitiva.

---

## 2. Decisões Arquiteturais Registradas (Decision Log)

| Decisão | Alternativa Descartada | Justificativa |
|---|---|---|
| **Remover botão "Concluir" mantendo o "X" de fechamento** | Fechar o modal imediatamente sem mostrar o link | Permite ao professor copiar o link ou enviar no WhatsApp na hora, sem criar dúvida sobre a conclusão do cadastro. |
| **Viewport nativo e contenção global de overflow** | Ajustes manuais de margens pontuais | Garante que o iPhone trate a página exatamente como um aplicativo nativo, sem zoom acidental ou scroll horizontal. |
| **Transporte de credenciais reais + Fallback em nuvem** | Exigir que a aluna reabra o WhatsApp toda vez | Garante autonomia total da aluna para deslogar e logar quando quiser pelo e-mail e senha cadastrada. |

---

## 3. Plano de Implementação
1. Modificar `src/components/common/ModalConviteAluno.tsx` para remover o botão "Concluir".
2. Atualizar `index.html`, `src/index.css` e `src/pages/aluno/AppAlunoPage.tsx` com as diretivas de responsividade e contenção horizontal.
3. Atualizar `src/lib/convite.ts` para incluir `e` (email) e `p` (telefone) no link e na extração.
4. Atualizar o fluxo de logout em `src/pages/aluno/AppAlunoPage.tsx` e `src/App.tsx` para manter a aluna na rota `/app`.
5. Atualizar os handlers de login em `src/pages/aluno/AppAlunoPage.tsx` e `src/pages/auth/LoginPage.tsx` para consulta assíncrona na nuvem caso o usuário não esteja no cache local.
6. Build, testes e deploy na Vercel.
