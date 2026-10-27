# Especificação Técnica: Autenticação, Persistência e Salvamento de Senha do Aluno no Celular

## 1. Contexto e Problema Resolvido
- **Causa Raiz Anterior**: Ao abrir o aplicativo pelo link compartilhado no WhatsApp (`https://www.appgiano.com.br/app?alunoId=...&s=6156`), o carregador de estado no `src/App.tsx` reescrevia a senha do aluno com a senha provisória da URL (`s=6156`), apagando qualquer senha personalizada que o aluno tivesse definido anteriormente.
- **Loop de Primeiro Acesso**: O modal de alteração de senha reaparecia a cada login bem-sucedido, mesmo que a troca já tivesse sido feita.
- **Ausência do Alerta Nativo de Salvamento no Celular**: O Safari (iOS) e o Chrome (Android) não disparavam a mensagem de salvar senha no Chaveiro/Smart Lock devido à ausência dos atributos web padrão de credenciais (`name="username"`, `autoComplete="username"`, `name="new-password"`, `autoComplete="new-password"`).
- **Parâmetros Residuais na URL**: A barra de endereços mantinha a query string do convite indefinidamente.

---

## 2. Decisões Arquiteturais Registradas (Decision Log)

| Decisão | Alternativa Descartada | Justificativa |
|---|---|---|
| **Abordagem 1: Autenticação Padrão W3C com Blindagem de Estado e Sessão Ativa** | Tokens temporários auto-destrutivos | Preserva a arquitetura limpa e sem dependências pesadas, sem risco de invalidar o link caso o aluno perca sinal 4G. |
| **Sessão Persistente no Dispositivo** | Exigir login manual a cada abertura | Proporciona experiência idêntica a aplicativo nativo instalado, permitindo abertura instantânea dos treinos. |
| **Limpeza com `window.history.replaceState`** | Redirecionamento completo de rota | Limpa a URL na barra de endereços para `/app` de forma instantânea sem disparar novo ciclo de recarregamento da aplicação. |
| **Identificador `username` Oculto nos Formulários** | Inputs avulsos fora de `<form>` | Requisito obrigatório dos motores WebKit (Safari) e Blink (Chrome) para vincular a credencial e acionar o Chaveiro do iCloud / Gerenciador de Senhas do Google. |

---

## 3. Especificação dos Componentes

### 3.1 `src/types.ts`
- Adição da propriedade opcional:
  ```typescript
  export interface Aluno {
    ...
    senha_alterada?: boolean;
  }
  ```

### 3.2 `src/App.tsx`
- No inicializador do estado `alunos`, quando `alunoUrl` é extraído dos parâmetros:
  - Se o aluno já existe na lista local (`idx >= 0`):
    - Se `listaAtual[idx].senha_alterada` ou `listaAtual[idx].senha !== alunoUrl.senha`:
      - **Preservar** a senha atual: `senha: listaAtual[idx].senha`.
      - **Preservar** treinos atribuídos e data de criação.
  - Ao persistir atualizações via `handleUpdateAluno`, garantir que qualquer alteração de senha grave `senha_alterada: true`.

### 3.3 `src/pages/aluno/AppAlunoPage.tsx`
- **Limpeza de URL**:
  - Na montagem do componente ou ao logar / alterar senha:
    ```typescript
    if (typeof window !== 'undefined' && window.location.search) {
      window.history.replaceState({}, '', window.location.pathname);
    }
    ```
- **Login Inteligente e Controle de Primeiro Acesso**:
  - No sucesso da validação de senha:
    - Se `aluno.senha_alterada === true`: Efetiva a entrada direta (`efetivarEntradaAluno(aluno)`), sem abrir modal de primeiro acesso.
    - Se `aluno.senha_alterada !== true`: Apresenta o modal de primeiro acesso permitindo definir sua senha definitiva.
- **Formulários Padronizados W3C**:
  - Modal de Troca / Criação de Senha:
    - `<form method="post" onSubmit={handleSalvarNovaSenha}>`
    - `<input type="text" name="username" autoComplete="username" value={alunoAlvo.telefone || alunoAlvo.email} readOnly className="sr-only" tabIndex={-1} />`
    - `<input type="password" name="new-password" autoComplete="new-password" ... />`
    - `<input type="password" name="new-password-confirm" autoComplete="new-password" ... />`
    - Botão `<button type="submit">`
  - Formulário de Convite:
    - `<form method="post" onSubmit={handleLoginConvidado}>`
    - `<input type="text" name="username" autoComplete="username" value={alunoConvidado.telefone || alunoConvidado.email} readOnly className="sr-only" tabIndex={-1} />`
    - `<input type="password" name="password" autoComplete="current-password" ... />`
  - Formulário Geral de Login:
    - `<form method="post" onSubmit={handleLogin}>`
    - `<input type="text" name="username" autoComplete="username" ... />`
    - `<input type="password" name="password" autoComplete="current-password" ... />`
- **Logout Seguro**:
  - Limpa `giano_aluno_ativo_id` do `localStorage`, retorna à tela de login limpa com os campos vazios para permitir preenchimento biométrico pelo sistema.

---

## 4. Plano de Verificação e Testes
1. Abertura do link do convite com WhatsApp e senha provisória de 4 dígitos.
2. Definição da nova senha pessoal (ex: `giano2026`).
3. Confirmação do disparo do alerta nativo do navegador do celular ("Salvar senha").
4. Verificação de URL limpa para `https://www.appgiano.com.br/app`.
5. Reabertura do link original do WhatsApp: confirmação de que a nova senha **não** é desfeita.
6. Fechamento e reabertura do App: acesso direto mantido sem tela de login.
7. Clique em "Sair": sessão encerrada e formulário sugerindo a credencial salva.
