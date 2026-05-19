---
name: implementation-plan
description: Use para planejar a implementação em passos pequenos e verificáveis antes de codar.
category: core
risk_level: low
---

# Objetivo
Transformar requisitos e critérios de aceitação em um plano de execução incremental.
Cada passo deve ser pequeno, ordenado e verificável, reduzindo risco e retrabalho.

# Quando usar
- Antes de iniciar implementação não trivial.
- Quando a tarefa toca vários módulos ou tem dependências.
- Quando há risco técnico ou ordem de execução importa.
- Para alinhar abordagem antes de gastar esforço.
- Quando a entrega pode ser fatiada.

# Quando não usar
- Mudança de uma linha com risco nulo.
- Tarefa exploratória sem objetivo de entrega.

# Regras obrigatórias
- Baseie o plano nos critérios de aceitação.
- Divida em passos pequenos e independentes quando possível.
- Defina como cada passo será verificado.
- Identifique riscos e dependências antes de começar.
- Não inclua escopo não solicitado no plano.
- Revise o plano se a realidade do código contradizê-lo.

# Processo
1. Releia critérios de aceitação e o mapa do código.
2. Liste as mudanças necessárias em ordem lógica.
3. Quebre mudanças grandes em passos menores.
4. Anote dependências e ordem obrigatória.
5. Defina verificação para cada passo.
6. Liste riscos e plano de mitigação.

# Checklist
- [ ] Plano cobre todos os critérios.
- [ ] Passos pequenos e ordenados.
- [ ] Dependências identificadas.
- [ ] Verificação por passo definida.
- [ ] Riscos listados.
- [ ] Sem escopo extra não solicitado.
- [ ] Plano ajustável se o código divergir.

# Anti-padrões
- ❌ Um único passo gigante "implementar tudo".
- ❌ Planejar sem conhecer o código.
- ❌ Ignorar dependências entre passos.
- ❌ Adicionar funcionalidades não pedidas.
