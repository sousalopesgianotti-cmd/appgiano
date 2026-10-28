# Especificação Técnica: Envio Inteligente do Link do App vs Convite Inicial

## 1. Contexto e Necessidade
- Quando o aluno é recém-cadastrado, ele precisa do **Convite de Primeiro Acesso** (com senha provisória e instruções de primeiro login).
- Após o aluno ter entrado e alterado sua senha, ele passa a ser um **Aluno Ativo Recorrente**. Se ele solicitar o link novamente, o personal precisa enviar o **Link Oficial do App** (`https://www.appgiano.com.br/app`), e nunca mais a mensagem de primeiro acesso com senha provisória.

---

## 2. Decisão de Arquitetura (Decision Log)

| Decisão | Escolha | Justificativa |
|---|---|---|
| **Diferenciação Automática** | Baseada no status `aluno.senha_alterada` | Se o aluno já definiu senha definitiva, o sistema sabe automaticamente que o convite provisório foi aposentado. |
| **Link para Aluno Recorrente** | `https://www.appgiano.com.br/app` (com e-mail pré-preenchido como query opcional) | Permite acesso direto à Área do Atleta sem atrito. |
| **Mensagem de WhatsApp Pronta** | Mensagem formatada com link + dica de PWA (Adicionar à Tela de Início) | Economiza tempo do personal trainer e instrui o atleta a ter o app instalado no celular. |
| **Interface no Painel do Personal** | Botão Inteligente de Compartilhar + Ação Direta WhatsApp | Mantém a tabela limpa e permite tanto copiar o link quanto abrir diretamente o WhatsApp do aluno. |

---

## 3. Plano Incremental de Implementação

### Bloco 1: Utilitários de Mensagem e Link em `src/lib/convite.ts`
- Implementar `gerarLinkAcessoAluno(origin, aluno)`:
  - Se `aluno.senha_alterada`: Retorna `https://www.appgiano.com.br/app?e=...`.
  - Se `!aluno.senha_alterada`: Retorna link completo de convite com `s=...`.
- Implementar `gerarMensagemWhatsAppAluno(origin, aluno)`:
  - Gera o texto pronto para WhatsApp com a formatação adequada para cada perfil de aluno.

### Bloco 2: Integração no Painel do Personal (`ClientesPage.tsx`)
- Atualizar a função `copiarLinkApp`:
  - Se aluno recorrente: copia o link definitivo e exibe toast: *"Link do App copiado! Envie para o aluno acessar seus treinos."*
  - Se aluno novo: copia o link de convite e exibe toast correspondente.
- Atualizar a ação de envio direto para o WhatsApp do aluno com a mensagem inteligente pronta.

---

## 4. Verificação e Testes
- Build limpo com `npm run build`.
- Teste de geração de mensagem para aluno com `senha_alterada: true` e `senha_alterada: false`.
- Deploy na Vercel e validação em produção.
