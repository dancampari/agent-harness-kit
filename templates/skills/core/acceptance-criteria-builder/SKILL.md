---
name: acceptance-criteria-builder
description: Use para definir critérios de aceitação objetivos antes de implementar uma tarefa.
category: core
risk_level: low
---

# Objetivo
Definir critérios de aceitação concretos e verificáveis que digam, sem ambiguidade, quando a tarefa está concluída.
Esses critérios são a referência para validar a entrega.

# Quando usar
- Após analisar requisitos e antes de planejar a implementação.
- Quando "pronto" pode ser interpretado de formas diferentes.
- Em tarefas com múltiplos cenários ou casos de borda.
- Antes de iniciar trabalho que será validado por terceiros.
- Quando há risco de entrega parcial passar como completa.

# Quando não usar
- Tarefa trivial com resultado único e óbvio.
- Exploração sem entrega definida.

# Regras obrigatórias
- Cada critério deve ser observável e testável.
- Cubra caminho feliz, erros e casos de borda.
- Inclua critérios não funcionais relevantes quando aplicável.
- Vincule cada critério a um requisito.
- Não use termos vagos como "funcionar bem" ou "rápido".
- Defina como cada critério será verificado.

# Processo
1. Releia requisitos e prioridades.
2. Para cada requisito, escreva um ou mais critérios verificáveis.
3. Adicione critérios para erros e casos de borda.
4. Defina o método de verificação de cada critério.
5. Revise para remover ambiguidade e termos subjetivos.
6. Confirme cobertura completa dos requisitos.

# Checklist
- [ ] Todos os requisitos têm critérios.
- [ ] Critérios são observáveis.
- [ ] Casos de erro cobertos.
- [ ] Casos de borda cobertos.
- [ ] Critérios não funcionais incluídos quando aplicável.
- [ ] Método de verificação definido.
- [ ] Sem termos vagos.

# Anti-padrões
- ❌ Critérios genéricos como "deve funcionar".
- ❌ Cobrir só o caminho feliz.
- ❌ Critério sem forma de verificar.
- ❌ Critérios desconectados dos requisitos.
