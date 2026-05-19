---
name: auth-boundary-review
description: Use ao revisar fronteiras de autenticação e autorização, incluindo isolamento entre tenants e usuários.
category: security
risk_level: high
---

# Objetivo
- Garantir que toda operação verifique identidade e permissão no ponto correto.
- Assegurar isolamento de dados entre tenants, organizações e usuários.
- Evitar escalada de privilégio e acesso cruzado entre contextos.

# Quando usar
- Ao criar ou alterar endpoints, handlers ou serviços que acessam dados.
- Ao introduzir múltiplos tenants, papéis ou níveis de acesso.
- Ao mudar como identidade e contexto são propagados entre camadas.

# Quando não usar
- Código sem acesso a dados de usuário e sem decisão de autorização.
- Ferramentas internas isoladas sem exposição a múltiplos atores.

# Regras obrigatórias
- Autenticação verificada antes de qualquer decisão de autorização.
- Autorização verificada no servidor, próxima ao acesso ao dado.
- Todo acesso a dado é filtrado pelo escopo do tenant/usuário do chamador.
- Identificador de tenant vem do contexto autenticado, nunca da entrada do cliente.
- Negar por padrão: ausência de permissão explícita bloqueia a operação.

# Processo
1. Identificar a fronteira de confiança e quem é o chamador autenticado.
2. Confirmar que a autorização ocorre no servidor, não só na UI.
3. Verificar que toda consulta/escrita é restrita ao escopo do tenant.
4. Testar acesso cruzado entre tenants e papéis diferentes.
5. Confirmar comportamento de negação por padrão em caminhos não cobertos.

# Checklist
- [ ] Autenticação validada antes da autorização.
- [ ] Autorização aplicada no servidor, próxima ao dado.
- [ ] Escopo de tenant/usuário aplicado em toda leitura e escrita.
- [ ] Identificador de tenant derivado do contexto autenticado.
- [ ] Acesso cruzado entre tenants testado e bloqueado.
- [ ] Caminhos sem regra explícita negam por padrão.

# Anti-padrões
❌ Confiar em ID de tenant enviado pelo cliente.
❌ Aplicar autorização apenas na interface, não no backend.
❌ Consultar dados sem filtro de escopo do chamador.
❌ Assumir que um usuário autenticado pode acessar qualquer recurso.
❌ Deixar rotas novas sem verificação de permissão explícita.
