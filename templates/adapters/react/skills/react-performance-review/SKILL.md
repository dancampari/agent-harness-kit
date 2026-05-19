---
name: react-performance-review
description: Use ao revisar re-renders, memoização, listas e custo de renderização React.
category: adapter:react
risk_level: medium
---

# Objetivo
Reduzir re-renders desnecessários e custo de renderização sem introduzir complexidade injustificada.

# Quando usar
- Listas grandes, árvores de componentes profundas ou re-renders perceptíveis.
- Uso (ou ausência) de `memo`, `useMemo`, `useCallback`.
- Context que dispara renders amplos.

# Quando não usar
- Componentes pequenos sem problema de performance medido.
- Otimização prematura sem evidência de gargalo.

# Regras obrigatórias
- Otimizar apenas com evidência (profiler/medição), não por suposição.
- Listas devem ter `key` estável e única (não índice quando a lista muda).
- Não criar objetos/funções inline passados a componentes memoizados sem `useCallback`/`useMemo`.
- Split de context quando valores mudam em frequências distintas.
- Não memoizar tudo cegamente; memoização tem custo.

# Processo
1. Confirme onde há gargalo real (React Profiler).
2. Verifique `key` de listas.
3. Identifique props instáveis quebrando `memo`.
4. Avalie context grande e proponha split/seletor.
5. Reavalie memoizações que não trazem ganho.

# Checklist
- [ ] Gargalo medido antes de otimizar.
- [ ] `key` estável em listas.
- [ ] Props estáveis para componentes memoizados.
- [ ] Context segmentado quando necessário.
- [ ] Sem memoização supérflua.

# Anti-padrões
- `key={index}` em lista reordenável.
- `<Child onClick={() => ...}/>` em filho `memo`.
- Context único com muitos valores heterogêneos.
- `useMemo` em cálculo trivial.
