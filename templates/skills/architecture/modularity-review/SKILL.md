---
name: modularity-review
description: Use ao avaliar coesão, acoplamento e fronteiras de módulos do sistema.
category: architecture
risk_level: medium
---

# Objetivo
Garantir que módulos tenham alta coesão e baixo acoplamento, permitindo mudança e teste isolados.

# Quando usar
- Ao criar ou dividir um módulo.
- Quando uma mudança simples obriga editar muitos módulos.
- Em revisão de organização do código.

# Quando não usar
- Em protótipo descartável de curtíssima vida.
- Quando o sistema é pequeno o bastante para não exigir divisão.
- Para microoptimizações sem impacto na estrutura.

# Regras obrigatórias
- Cada módulo tem um propósito único e claro.
- Dependências fluem em uma direção, sem ciclos.
- Detalhes internos ocultos atrás de uma interface estável.
- Acoplamento por contrato, não por estrutura interna.
- Tamanho do módulo proporcional à sua responsabilidade.

# Processo
1. Identifique a responsabilidade de cada módulo.
2. Mapeie dependências entre módulos.
3. Detecte ciclos e acoplamentos indevidos.
4. Verifique o que é exposto versus interno.
5. Proponha divisão ou unificação quando necessário.
6. Confirme que cada módulo testa de forma isolada.

# Checklist
- [ ] Propósito único por módulo
- [ ] Sem dependências cíclicas
- [ ] Detalhes internos encapsulados
- [ ] Acoplamento via contrato
- [ ] Módulos testáveis isoladamente
- [ ] Tamanho proporcional à responsabilidade

# Anti-padrões
❌ Módulo "faz-tudo" sem foco
❌ Ciclo de dependência entre módulos
❌ Expor estrutura interna como API
❌ Mudança trivial que se espalha por todo o sistema
❌ Dividir por camada técnica ignorando coesão funcional
