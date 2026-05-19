---
name: react-state-and-effects-review
description: Use ao revisar useState/useEffect, dependências de hooks e gerência de estado React.
category: adapter:react
risk_level: high
---

# Objetivo
Evitar bugs de estado e efeitos em React: dependências erradas, loops e estado derivado incorreto.

# Quando usar
- Componentes com `useState`, `useEffect`, `useMemo`, `useCallback` ou reducers.
- Sincronização com fontes externas (fetch, subscriptions, timers).
- Lógica de estado compartilhado/contexto.

# Quando não usar
- Componentes puramente apresentacionais sem estado.
- Mudanças apenas de markup/estilo.

# Regras obrigatórias
- Array de dependências de `useEffect` deve listar tudo que é usado dentro do efeito.
- Cleanup obrigatório para subscriptions, timers e listeners.
- Não derivar estado que pode ser calculado durante o render.
- Não atualizar estado dentro do render sem condição de parada.
- Efeitos não devem ser usados para transformar props em estado desnecessariamente.

# Processo
1. Liste todos os hooks e suas dependências reais.
2. Verifique funções de cleanup em efeitos com recursos.
3. Identifique estado derivado que deveria ser computado.
4. Procure loops de atualização (set state em efeito sem guarda).
5. Confirme estabilidade de referências passadas a dependências.

# Checklist
- [ ] Deps de efeito completas e corretas.
- [ ] Cleanup presente onde necessário.
- [ ] Sem estado derivado redundante.
- [ ] Sem loop de re-render.
- [ ] Referências estáveis em deps.

# Anti-padrões
- `useEffect(() => setX(prop), [])` para copiar prop.
- Subscription sem `return () => unsubscribe()`.
- Dependência omitida silenciando o lint de hooks.
- `setState` em efeito sem condição, causando loop.
