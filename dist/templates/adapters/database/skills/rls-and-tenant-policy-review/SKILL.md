---
name: rls-and-tenant-policy-review
description: Use ao revisar Row Level Security, políticas de acesso e isolamento multi-tenant no banco.
category: adapter:database
risk_level: high
---

# Objetivo
Garantir isolamento correto de dados por usuário/tenant via políticas de acesso (RLS ou equivalente).

# Quando usar
- Tabelas com dados por-usuário ou multi-tenant.
- Criação/alteração de políticas RLS (ex.: Postgres/Supabase) ou regras de autorização no banco.
- Mudança de colunas de tenant/owner (`user_id`, `org_id`, `tenant_id`).

# Quando não usar
- Tabelas puramente públicas/estáticas sem dados sensíveis.
- Bancos sem suporte ou necessidade de isolamento por linha.

# Regras obrigatórias
- RLS deve estar ATIVA em toda tabela com dados por-usuário/tenant antes de expor a API.
- Toda operação (SELECT/INSERT/UPDATE/DELETE) deve ter política explícita; sem política = sem acesso.
- Política deve filtrar pelo identificador de tenant/owner derivado da sessão autenticada, não de input do cliente.
- Caminhos privilegiados (service role / admin) só no backend, nunca expostos ao cliente.
- `USING` e `WITH CHECK` devem cobrir leitura e gravação coerentemente.

# Processo
1. Liste tabelas sensíveis e confirme RLS habilitada.
2. Para cada comando, verifique existência e correção da política.
3. Confirme que o filtro usa identidade da sessão (ex.: `auth.uid()`), não valor enviado.
4. Teste cenários cross-tenant (usuário A não acessa dados de B).
5. Verifique que bypass só ocorre via credencial privilegiada no servidor.

# Checklist
- [ ] RLS ativa em tabelas sensíveis.
- [ ] Políticas para todos os comandos.
- [ ] Filtro por identidade da sessão.
- [ ] `WITH CHECK` em INSERT/UPDATE.
- [ ] Bypass restrito ao backend.

# Anti-padrões
- Tabela com dado de usuário e RLS desabilitada.
- Política usando `tenant_id` vindo do payload do cliente.
- Só política de SELECT, deixando INSERT/UPDATE aberto.
- Service role key acessível no front-end.
