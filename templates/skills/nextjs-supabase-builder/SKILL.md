---
name: nextjs-supabase-builder
description: Use ao implementar funcionalidades em projetos Next.js + Supabase. Não use para projetos sem Next.js/Supabase, decisões de infraestrutura ou revisão pura de segurança (use supabase-rls-reviewer).
---

# nextjs-supabase-builder

## Objetivo

Guiar a implementação de funcionalidades em projetos Next.js + Supabase
com tipagem forte, separação correta server/client e segurança de chaves.

## Quando usar

- Criar páginas, rotas, Server Actions ou API handlers em Next.js
- Ler/gravar dados via Supabase client/server
- Adicionar formulários e mutações

## Quando não usar

- O projeto não usa Next.js nem Supabase
- A tarefa é só revisão de RLS/policies → use `supabase-rls-reviewer`
- A tarefa é workflow n8n → use `n8n-evolution-workflow`

## Regras obrigatórias

- Usar tipagem forte (sem `any` implícito; tipar respostas do Supabase).
- Separar server/client components quando aplicável.
- Nunca expor a service role key no client.
- Validar inputs (ex.: Zod) antes de persistir.
- Criar tratamento de erro explícito (sem engolir exceções).
- Respeitar a estrutura existente do projeto.
- Registrar novas variáveis de ambiente em `.harness/project-context.md`
  e no `.env.example` quando existir.

## Checklist de validação

- [ ] Sem `SUPABASE_SERVICE_ROLE_KEY` em código client
- [ ] Inputs validados antes de chamadas ao banco
- [ ] Tipos das queries definidos
- [ ] Erros tratados e mensagens seguras (sem vazar internals)
- [ ] Novas env vars documentadas
- [ ] Lint/typecheck/build passam

## Exemplos

```ts
// server-only: usa cliente server com cookies do usuário
const supabase = createServerClient(/* ... */);
const { data, error } = await supabase
  .from("appointments")
  .select("id, starts_at")
  .eq("tenant_id", tenantId);
if (error) return fail("não foi possível carregar agendamentos");
```

## Anti-padrões

- ❌ Usar service role key em componente client
- ❌ `select('*')` em tabelas sensíveis sem filtrar por tenant
- ❌ Persistir input do usuário sem validação
- ❌ Capturar erro e continuar como se tudo estivesse certo
