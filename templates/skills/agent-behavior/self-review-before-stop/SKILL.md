---
name: self-review-before-stop
description: Use antes de encerrar o trabalho para revisar criticamente a própria entrega.
category: agent-behavior
risk_level: medium
---

# Objetivo
Fazer uma revisão crítica do próprio trabalho antes de parar.
Detectar erros, omissões e regressões enquanto ainda é barato corrigi-los.

# Quando usar
- Antes de finalizar e entregar qualquer tarefa.
- Após a última alteração de código.
- Quando a tarefa tocou múltiplos pontos do sistema.
- Antes de marcar itens como concluídos.
- Após corrigir um problema apontado.

# Quando não usar
- Trabalho explicitamente em rascunho intermediário.
- Revisão completa já feita sem mudanças desde então.

# Regras obrigatórias
- Releia o diff completo das suas alterações.
- Confirme que o escopo entregue bate com o solicitado.
- Procure efeitos colaterais e regressões.
- Verifique tratamento de erros e casos de borda.
- Remova código morto, depuração temporária e restos.
- Corrija o que encontrar antes de encerrar.

# Processo
1. Revise todas as mudanças linha a linha.
2. Compare o resultado com requisitos e critérios.
3. Procure regressões em pontos dependentes.
4. Cheque erros, bordas e entradas inválidas.
5. Limpe restos de depuração e código não usado.
6. Corrija problemas; só então encerre.

# Checklist
- [ ] Diff revisado por completo.
- [ ] Escopo confere com o pedido.
- [ ] Sem regressões aparentes.
- [ ] Erros e bordas tratados.
- [ ] Sem código morto ou de depuração.
- [ ] Problemas encontrados corrigidos.
- [ ] Pronto para entrega real.

# Anti-padrões
- ❌ Entregar sem reler o que mudou.
- ❌ Ignorar impacto em código dependente.
- ❌ Deixar logs e gambiarras temporárias.
- ❌ Adiar correções óbvias para depois.
