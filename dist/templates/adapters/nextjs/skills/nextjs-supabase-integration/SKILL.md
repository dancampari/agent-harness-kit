---
name: nextjs-supabase-integration
description: Use ao integrar Supabase em Next.js (auth, sessão, clientes server/client, RLS).
category: adapter:nextjs
risk_level: high
---

# Objetivo
Integrar Supabase ao Next.js com sessão segura, clientes corretos por contexto e RLS respeitada.

# Quando usar
- Configuração de `@supabase/supabase-js` ou `@supabase/ssr` em Next.js.
- Autenticação, middleware de sessão ou acesso a dados via Supabase.
- Uso de service role key ou políticas RLS.

# Quando não usar
- Projeto Next.js sem Supabase.
- Mudanças que não tocam auth/dados Supabase.

# Regras obrigatórias
- `SUPABASE_SERVICE_ROLE_KEY` apenas em código server; nunca exposta ao client.
- Cliente do browser usa apenas `NEXT_PUBLIC_SUPABASE_URL` e a anon key.
- Usar cliente SSR adequado (cookies) em Server Components/Route Handlers/middleware.
- Não desabilitar RLS para "facilitar"; acesso privilegiado só via service role no server.
- Sessão deve ser revalidada no server; não confiar apenas no estado do client.

# Processo
1. Separe clientes: browser (anon) vs server (cookies / service role).
2. Verifique onde a service role key é usada e confirme isolamento server.
3. Revise middleware/Route Handlers de sessão e refresh de token.
4. Confirme que tabelas sensíveis têm RLS ativa e políticas corretas.
5. Cheque que dados por-usuário não são cacheados estaticamente.

# Checklist
- [ ] Service role key só no server.
- [ ] Browser usa apenas anon key.
- [ ] Cliente SSR com cookies onde aplicável.
- [ ] RLS ativa em tabelas sensíveis.
- [ ] Sessão revalidada no server.

# Anti-padrões
- Service role key em `NEXT_PUBLIC_*` ou bundle client.
- RLS desativada como atalho.
- Usar cliente do browser dentro de Server Action para dados privilegiados.
- Cachear página autenticada como estática.
