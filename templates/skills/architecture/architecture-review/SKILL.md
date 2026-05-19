---
name: architecture-review
description: Use ao avaliar decisões estruturais amplas que afetam múltiplos módulos ou o sistema todo.
category: architecture
risk_level: high
---

# Objetivo
Validar se a estrutura proposta atende requisitos, limita acoplamento e suporta evolução com custo previsível.

# Quando usar
- Antes de iniciar um componente ou serviço novo relevante.
- Ao introduzir mudança transversal de design.
- Quando decisões agora terão custo alto de reverter depois.

# Quando não usar
- Para mudanças localizadas dentro de um único módulo.
- Em ajustes puramente cosméticos ou de estilo.
- Quando o problema é tático e não estrutural.

# Regras obrigatórias
- Decisão deve mapear a um requisito ou restrição explícita.
- Acoplamento entre componentes minimizado e justificado.
- Limites e responsabilidades de cada parte definidos.
- Trade-offs registrados, incluindo alternativas descartadas.
- Caminho de evolução e reversão considerado.

# Processo
1. Liste requisitos, restrições e qualidades alvo.
2. Descreva os componentes e seus limites.
3. Avalie acoplamento, dependências e pontos de falha.
4. Compare ao menos uma alternativa.
5. Registre trade-offs e a decisão.
6. Defina como a estrutura pode evoluir.

# Checklist
- [ ] Requisitos e restrições explícitos
- [ ] Limites de componentes definidos
- [ ] Acoplamento minimizado e justificado
- [ ] Alternativa avaliada
- [ ] Trade-offs documentados
- [ ] Caminho de evolução previsto

# Anti-padrões
❌ Decidir estrutura sem requisito que a sustente
❌ Acoplamento forte sem justificativa
❌ Escolher solução sem comparar alternativas
❌ Otimizar para hoje ignorando evolução
❌ Decisão estrutural sem registro de trade-offs
