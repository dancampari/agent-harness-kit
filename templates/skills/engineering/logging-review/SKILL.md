---
name: logging-review
description: Use ao revisar o que, como e em que nível o código registra logs.
category: engineering
risk_level: low
---

# Objetivo
Garantir logs úteis para diagnóstico, com níveis corretos e sem vazar dados sensíveis ou gerar ruído.

# Quando usar
- Ao adicionar instrumentação a um novo fluxo.
- Em revisão de observabilidade antes de implantar.
- Quando logs estão excessivos, ausentes ou pouco acionáveis.

# Quando não usar
- Em código de teste puramente local.
- Para substituir métricas ou rastreamento estruturado adequado.
- Quando a prioridade é correção funcional imediata.

# Regras obrigatórias
- Nível adequado: erro para falha, aviso para risco, info para evento relevante.
- Nunca registrar segredos ou dados pessoais sensíveis.
- Mensagens com contexto suficiente para ação.
- Sem log dentro de laços quentes que gere flood.
- Formato consistente em todo o projeto.

# Processo
1. Liste os pontos onde decisões e falhas ocorrem.
2. Escolha o nível correto para cada evento.
3. Inclua contexto identificador mínimo e seguro.
4. Remova logs ruidosos ou redundantes.
5. Verifique ausência de dados sensíveis.
6. Confirme consistência de formato.

# Checklist
- [ ] Níveis de log corretos
- [ ] Sem dados sensíveis nos logs
- [ ] Contexto suficiente para diagnóstico
- [ ] Sem flood em caminhos quentes
- [ ] Formato consistente
- [ ] Sem logs redundantes ou mortos

# Anti-padrões
❌ Registrar senha, token ou dado pessoal
❌ Usar erro para evento normal (ou info para falha grave)
❌ Mensagem sem contexto ("erro", "falhou")
❌ Log dentro de laço de alta frequência
❌ Misturar formatos diferentes de log no projeto
