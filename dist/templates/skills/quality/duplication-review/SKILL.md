---
name: duplication-review
description: Use para identificar duplicação significativa e decidir quando consolidar com segurança.
category: quality
risk_level: low
---

# Objetivo
Reduzir duplicação que aumenta custo de manutenção e risco de divergência, sem criar abstrações prematuras ou acoplamento indevido.

# Quando usar
- Ao notar lógica repetida em vários pontos do código.
- Quando uma correção precisa ser aplicada em mais de um lugar.
- Ao revisar código copiado e colado com pequenas variações.
- Antes de consolidar trechos parecidos em uma abstração.

# Quando não usar
- Semelhança superficial entre conceitos que evoluem separadamente.
- Duplicação pontual cuja unificação geraria acoplamento maior.
- Código gerado ou de teste onde repetição melhora a clareza.

# Regras obrigatórias
- Consolide apenas duplicação que representa o mesmo conceito.
- Uma abstração só é justificada por repetição real e estável.
- A consolidação não pode acoplar contextos que devem variar.
- Comportamento de todos os pontos afetados deve ser preservado.
- Prefira clareza a reuso forçado quando houver conflito.

# Processo
1. Liste as ocorrências duplicadas e compare seu propósito real.
2. Verifique se representam o mesmo conceito ou só se parecem.
3. Se forem o mesmo conceito, extraia uma unidade compartilhada.
4. Ajuste todos os pontos de uso para a fonte única.
5. Garanta que variações legítimas continuem possíveis.
6. Reexecute os testes dos trechos afetados.

# Checklist
- [ ] Ocorrências de duplicação mapeadas
- [ ] Confirmado que são o mesmo conceito
- [ ] Fonte única criada quando justificada
- [ ] Pontos de uso atualizados
- [ ] Variações legítimas ainda suportadas
- [ ] Testes dos trechos afetados verdes

# Anti-padrões
❌ Unificar trechos parecidos que evoluem por motivos diferentes
❌ Criar abstração após uma única repetição
❌ Acoplar contextos distintos só para evitar repetir código
❌ Deixar a mesma correção espalhada em vários lugares
❌ Sacrificar clareza por reuso forçado
