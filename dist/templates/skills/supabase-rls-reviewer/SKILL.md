---
name: supabase-rls-reviewer
description: Use para revisar segurança, RLS, tenant_id, policies, migrations e exposição de dados em Supabase. Não use para implementar features de UI (use nextjs-supabase-builder) nem para projetos sem Supabase.
---

# supabase-rls-reviewer

## Objetivo

Revisar segurança de dados no Supabase: RLS, `tenant_id`, policies,
migrations e qualquer exposição indevida ao client.

## Quando usar

- Revisar uma migration nova
- Adicionar/alterar tabela acessível pelo client
- Auditar se há vazamento entre tenants
- Antes de concluir tarefas que tocam o banco

## Quando não usar

- Projeto não usa Supabase
- Tarefa puramente de UI sem acesso a dados sensíveis

## Regras obrigatórias

- Toda tabela multi-tenant deve ter `tenant_id`.
- Toda query sensível deve filtrar por `tenant_id`.
- Toda tabela exposta ao client deve ter RLS habilitado.
- Nunca usar service role no browser.
- Migrations devem ser reversíveis ou ter rollback documentado.

## Checklist de validação

- [ ] `ENABLE ROW LEVEL SECURITY` em toda tabela exposta
- [ ] Policies cobrem SELECT/INSERT/UPDATE/DELETE conforme o caso
- [ ] Policies amarram `tenant_id` ao usuário/JWT
- [ ] Nenhuma policy `USING (true)` em dados sensíveis
- [ ] Migration tem caminho de rollback (ou nota explícita)
- [ ] Nenhum uso de service role acessível ao client

## Exemplos

```sql
alter table public.appointments enable row level security;

create policy "tenant can read own appointments"
on public.appointments for select
using ( tenant_id = (auth.jwt() ->> 'tenant_id')::uuid );
```

## Anti-padrões

- ❌ Tabela exposta ao client sem RLS
- ❌ Policy `using (true)` em tabela com dados de múltiplos tenants
- ❌ Migration destrutiva sem rollback nem aviso
- ❌ Service role em código que roda no navegador
