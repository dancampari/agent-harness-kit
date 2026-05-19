---
name: data-model-review
description: Use ao projetar ou alterar o modelo de dados, esquemas, relações e restrições de integridade.
category: data
risk_level: high
---

# Objetivo
- Garantir um modelo de dados consistente, íntegro e evolutivo.
- Evitar anomalias, ambiguidade e perda de integridade referencial.
- Antecipar impacto de mudanças de esquema no sistema.

# Quando usar
- Ao criar ou modificar entidades, atributos ou relacionamentos.
- Ao introduzir restrições, chaves, índices ou normalização.
- Ao revisar como dados de múltiplos tenants são separados no modelo.

# Quando não usar
- Mudanças puramente de apresentação sem efeito no armazenamento.
- Lógica de negócio que não altera estrutura nem semântica dos dados.

# Regras obrigatórias
- Toda entidade tem identidade clara e restrições de integridade explícitas.
- Relacionamentos preservam integridade referencial e cardinalidade correta.
- Escopo de tenant é representável e aplicável no modelo, quando multi-tenant.
- Dados obrigatórios são não nulos; invariantes são impostas pelo esquema.
- Mudanças de esquema consideram compatibilidade com versões existentes.

# Processo
1. Definir entidades, atributos e relacionamentos afetados.
2. Especificar chaves, restrições e invariantes de integridade.
3. Avaliar normalização versus necessidades de leitura/escrita.
4. Verificar representação de isolamento de tenant, se aplicável.
5. Analisar impacto da mudança em código e dados existentes.

# Checklist
- [ ] Cada entidade tem identidade e restrições claras.
- [ ] Integridade referencial e cardinalidade corretas.
- [ ] Campos obrigatórios marcados como não nulos.
- [ ] Invariantes impostas pelo esquema, não só por código.
- [ ] Isolamento de tenant representado no modelo, se aplicável.
- [ ] Impacto da mudança em dados existentes avaliado.

# Anti-padrões
❌ Depender apenas de código para garantir integridade dos dados.
❌ Relacionamentos sem chave ou restrição definida.
❌ Reutilizar campos genéricos para múltiplos significados.
❌ Misturar dados de tenants sem coluna/escopo de separação.
❌ Alterar esquema sem avaliar dados e código já existentes.
