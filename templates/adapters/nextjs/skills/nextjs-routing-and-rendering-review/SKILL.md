---
name: nextjs-routing-and-rendering-review
description: Use ao revisar App/Pages Router, estratégias de renderização e data fetching no Next.js.
category: adapter:nextjs
risk_level: medium
---

# Objetivo
Garantir uso correto de roteamento e estratégias de renderização (SSR/SSG/ISR) no Next.js.

# Quando usar
- Novas rotas em `app/` ou `pages/`.
- Escolha entre SSR, SSG, ISR ou renderização dinâmica.
- Configuração de `revalidate`, `generateStaticParams` ou `fetch` com cache.

# Quando não usar
- Mudanças apenas de UI sem impacto em roteamento/dados.
- Projetos que não usam Next.js.

# Regras obrigatórias
- Não misturar convenções de App Router e Pages Router para a mesma rota.
- Definir explicitamente a estratégia de cache do `fetch` (`force-cache`/`no-store`/`revalidate`).
- Dados sensíveis ou por-usuário não podem ser estaticamente cacheados.
- `generateStaticParams` deve cobrir apenas rotas conhecidas e seguras.
- Erros e estados de loading devem ter `error.tsx`/`loading.tsx` quando aplicável.

# Processo
1. Identifique o router usado e a convenção de arquivos.
2. Determine a estratégia de renderização adequada por rota.
3. Verifique semântica de cache em cada `fetch`.
4. Confirme que dados por-usuário usam render dinâmico.
5. Cheque tratamento de erro/loading e `notFound()`.

# Checklist
- [ ] Router consistente por rota.
- [ ] Estratégia de cache explícita.
- [ ] Sem cache estático de dados por-usuário.
- [ ] `generateStaticParams` seguro.
- [ ] `error.tsx`/`loading.tsx` presentes onde necessário.

# Anti-padrões
- `fetch` sem definir cache em dados dinâmicos.
- Página de usuário logado gerada como SSG.
- Mistura de `getServerSideProps` com App Router.
- Falta de `notFound()` para recurso inexistente.
