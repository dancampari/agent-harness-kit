---
name: integration-error-handling
description: Use ao revisar integrações para tratamento robusto de erros, timeouts e degradação controlada.
category: api
risk_level: medium
---

# Objetivo
- Garantir que falhas de integrações externas sejam detectadas, tratadas e isoladas sem derrubar o sistema.
- Oferecer degradação previsível em vez de falha silenciosa.

# Quando usar
- Ao integrar com qualquer serviço externo ou dependência remota.
- Ao adicionar chamadas críticas dentro de um fluxo de negócio.
- Antes de liberar funcionalidades dependentes de terceiros.

# Quando não usar
- Projeto sem integrações externas.
- Componente totalmente isolado sem dependências remotas.

# Regras obrigatórias
- Toda chamada externa deve ter timeout explícito.
- Erros devem ser categorizados (transitório, definitivo, indisponível).
- Falha de dependência não essencial não pode derrubar o fluxo principal.
- Mensagens de erro internas não devem vazar para o usuário final.
- Falhas relevantes devem ser registradas com contexto suficiente.

# Processo
1. Identifique as dependências externas e sua criticidade.
2. Defina timeout adequado para cada chamada.
3. Categorize os erros e a resposta esperada para cada um.
4. Defina degradação ou fallback para dependências não essenciais.
5. Registre falhas com contexto e correlação.
6. Teste timeout, indisponibilidade e respostas inesperadas.

# Checklist
- [ ] Timeout explícito em toda chamada externa
- [ ] Erros categorizados e tratados por tipo
- [ ] Dependência não essencial isolada do fluxo principal
- [ ] Erro interno não exposto ao usuário
- [ ] Falhas registradas com contexto
- [ ] Cenários de indisponibilidade testados

# Anti-padrões
- ❌ Chamada externa sem timeout
- ❌ Tratar todos os erros de forma genérica e idêntica
- ❌ Quebrar o fluxo inteiro por falha de dependência opcional
- ❌ Repassar mensagem técnica crua ao usuário
- ❌ Engolir o erro sem registro nem decisão
