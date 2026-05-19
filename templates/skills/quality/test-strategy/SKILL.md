---
name: test-strategy
description: Use quando precisar planejar ou avaliar a cobertura e a estratégia de testes de uma mudança ou módulo.
category: quality
risk_level: medium
---

# Objetivo
Garantir que a mudança tenha uma estratégia de testes proporcional ao risco, cobrindo comportamento, bordas e regressões prováveis.

# Quando usar
- Antes de implementar uma funcionalidade nova ou alterar lógica de negócio.
- Quando uma área crítica não possui testes ou tem cobertura frágil.
- Ao revisar um pull request com baixa confiança de qualidade.
- Ao planejar refatorações que precisam de rede de segurança.

# Quando não usar
- Mudanças triviais sem lógica (texto, formatação, comentários).
- Protótipos descartáveis explicitamente marcados como temporários.
- Quando já existe suíte adequada e a mudança não altera comportamento.

# Regras obrigatórias
- Toda lógica condicional ou de cálculo deve ter ao menos um teste de comportamento.
- Cobrir caminho feliz, casos de borda e entradas inválidas.
- Testes devem ser determinísticos e independentes de ordem de execução.
- Falhas devem produzir mensagens claras que apontem a causa.
- Não testar detalhes internos quando o contrato público basta.

# Processo
1. Identifique o comportamento observável e os contratos afetados pela mudança.
2. Liste os cenários: caminho feliz, bordas, erros e estados inválidos.
3. Priorize cenários por risco e impacto, não por facilidade.
4. Escolha o nível adequado: unidade, integração ou ponta a ponta.
5. Escreva ou ajuste os testes antes de considerar a tarefa concluída.
6. Execute a suíte e confirme que falhas refletem regressões reais.

# Checklist
- [ ] Caminho feliz coberto
- [ ] Casos de borda e limites cobertos
- [ ] Entradas inválidas e erros tratados em teste
- [ ] Testes determinísticos e isolados
- [ ] Nível de teste adequado ao risco
- [ ] Suíte executada e verde

# Anti-padrões
❌ Escrever testes só do caminho feliz e ignorar bordas
❌ Testes que dependem de ordem, relógio ou estado global
❌ Asserções vagas que não localizam a causa da falha
❌ Cobrir código trivial e deixar a lógica crítica sem teste
❌ Acoplar testes a detalhes internos que mudam com frequência
