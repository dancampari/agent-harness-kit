---
name: interface-contracts
description: Use ao definir ou alterar contratos entre componentes, módulos ou serviços.
category: architecture
risk_level: medium
---

# Objetivo
Estabelecer contratos explícitos e estáveis que permitam mudar implementações sem quebrar consumidores.

# Quando usar
- Ao criar uma fronteira entre produtor e consumidor.
- Ao alterar entrada, saída ou semântica de uma interface existente.
- Quando vários clientes dependem do mesmo ponto de integração.

# Quando não usar
- Em detalhes puramente internos de um único módulo.
- Em código exploratório sem consumidores reais.
- Quando o contrato é trivial e estável por natureza.

# Regras obrigatórias
- Entradas, saídas e erros do contrato definidos explicitamente.
- Pré-condições e pós-condições documentadas.
- Mudança incompatível exige versionamento ou migração.
- Contrato independente de detalhes de implementação.
- Comportamento em casos de borda especificado.

# Processo
1. Defina o propósito da interface e seus consumidores.
2. Especifique entradas, saídas e erros possíveis.
3. Documente pré e pós-condições.
4. Avalie impacto de cada mudança nos consumidores.
5. Versione ou planeje migração se for incompatível.
6. Valide o contrato com casos de borda.

# Checklist
- [ ] Entradas e saídas especificadas
- [ ] Erros e bordas definidos
- [ ] Pré e pós-condições documentadas
- [ ] Independente da implementação
- [ ] Mudança incompatível versionada
- [ ] Consumidores considerados

# Anti-padrões
❌ Contrato implícito "descubra usando"
❌ Vazar detalhes internos na assinatura pública
❌ Quebrar consumidores sem versionar
❌ Não especificar comportamento de erro
❌ Mudar semântica mantendo a mesma assinatura
