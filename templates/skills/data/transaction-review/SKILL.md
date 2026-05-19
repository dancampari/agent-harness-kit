---
name: transaction-review
description: Use ao revisar operações que exigem atomicidade, consistência e isolamento entre múltiplas escritas.
category: data
risk_level: high
---

# Objetivo
- Garantir que operações compostas sejam atômicas e consistentes.
- Evitar estados parciais, condições de corrida e dados corrompidos.
- Definir limites de transação e estratégia de falha claros.

# Quando usar
- Ao realizar múltiplas escritas que precisam ter sucesso ou falhar juntas.
- Ao coordenar atualizações concorrentes sobre o mesmo estado.
- Ao integrar efeitos internos com sistemas externos não transacionais.

# Quando não usar
- Operação única e atômica por natureza, sem estado compartilhado.
- Leituras sem necessidade de consistência forte.

# Regras obrigatórias
- Escritas relacionadas ocorrem em uma única unidade atômica.
- Limites da transação são mínimos e bem definidos.
- Concorrência é tratada com bloqueio adequado ou controle otimista.
- Efeitos externos não transacionais ficam fora do limite atômico e são compensáveis.
- Falha em qualquer passo reverte ou compensa o estado para consistente.

# Processo
1. Identificar o conjunto de escritas que devem ser atômicas.
2. Definir o limite da transação e o que fica fora dela.
3. Escolher estratégia de concorrência (bloqueio ou otimista).
4. Planejar compensação para efeitos externos não reversíveis.
5. Testar falhas no meio da operação e acesso concorrente.

# Checklist
- [ ] Escritas relacionadas agrupadas em unidade atômica.
- [ ] Limite da transação mínimo e explícito.
- [ ] Estratégia de concorrência definida e adequada.
- [ ] Efeitos externos fora do limite atômico e compensáveis.
- [ ] Falha parcial leva a estado consistente (rollback ou compensação).
- [ ] Cenários de concorrência e falha intermediária testados.

# Anti-padrões
❌ Espalhar escritas relacionadas em operações separadas sem atomicidade.
❌ Manter chamadas externas lentas dentro do limite transacional.
❌ Ignorar condições de corrida em atualizações concorrentes.
❌ Deixar estado parcial após falha sem rollback ou compensação.
❌ Transações longas que bloqueiam recursos por tempo excessivo.
