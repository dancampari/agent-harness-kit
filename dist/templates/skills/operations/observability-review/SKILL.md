---
name: observability-review
description: Use para avaliar se a mudança pode ser monitorada, diagnosticada e investigada em produção.
category: operations
risk_level: medium
---

# Objetivo
Garantir que o comportamento do sistema seja observável: que falhas e degradações possam ser detectadas e diagnosticadas sem acesso direto ao ambiente.

# Quando usar
- Ao adicionar fluxos críticos ou caminhos de erro novos.
- Quando incidentes recentes foram difíceis de diagnosticar.
- Antes de implantar mudanças que afetam disponibilidade ou dados.
- Ao revisar integrações com sistemas externos.

# Quando não usar
- Código trivial sem efeito operacional observável.
- Scripts efêmeros que não rodam em ambiente monitorado.
- Mudanças puramente internas sem impacto em runtime.

# Regras obrigatórias
- Erros relevantes devem ser registrados com contexto suficiente para diagnóstico.
- Sinais de saúde de fluxos críticos devem ser observáveis externamente.
- Logs e métricas não podem conter segredos ou dados sensíveis.
- Cada caminho de falha deve ser detectável, não silencioso.
- O volume de sinais deve permitir distinguir ruído de problema real.

# Processo
1. Identifique os fluxos críticos e seus modos de falha.
2. Verifique se cada falha gera um sinal observável e acionável.
3. Confira se o contexto registrado permite localizar a causa.
4. Garanta que dados sensíveis não vazam para logs ou métricas.
5. Avalie se há sinais de saúde para detectar degradação.
6. Ajuste o volume para evitar ruído e cegueira por excesso.

# Checklist
- [ ] Fluxos críticos e modos de falha mapeados
- [ ] Cada falha gera sinal observável e acionável
- [ ] Contexto suficiente para diagnosticar a causa
- [ ] Sem segredos ou dados sensíveis em logs/métricas
- [ ] Sinais de saúde para detectar degradação
- [ ] Volume de sinais sem ruído excessivo

# Anti-padrões
❌ Engolir exceções sem registrar nada
❌ Logar segredos, tokens ou dados pessoais
❌ Mensagens genéricas sem contexto para diagnóstico
❌ Falhas silenciosas que só aparecem por reclamação do usuário
❌ Ruído tão alto que sinais reais se perdem
