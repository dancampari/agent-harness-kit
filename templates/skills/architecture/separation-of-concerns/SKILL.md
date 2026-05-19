---
name: separation-of-concerns
description: Use ao avaliar se responsabilidades distintas estão isoladas em camadas ou unidades próprias.
category: architecture
risk_level: medium
---

# Objetivo
Manter responsabilidades diferentes separadas, evitando que regras, integração e apresentação se misturem.

# Quando usar
- Ao revisar código que mistura lógica e infraestrutura.
- Ao desenhar camadas de um novo fluxo.
- Quando uma mudança em uma área força alterar áreas não relacionadas.

# Quando não usar
- Em scripts triviais sem camadas distintas.
- Quando a separação adicionaria complexidade sem ganho real.
- Em protótipo de vida muito curta.

# Regras obrigatórias
- Regra de negócio não depende de detalhe de entrega ou armazenamento.
- Cada unidade trata de uma única preocupação.
- Dependências apontam para abstrações, não para detalhes.
- Entrada/saída isolada da lógica central.
- Fronteiras entre camadas explícitas.

# Processo
1. Identifique as preocupações presentes no código.
2. Classifique cada trecho por sua responsabilidade.
3. Separe lógica central de integração e apresentação.
4. Inverta dependências em direção a abstrações.
5. Defina fronteiras claras entre as camadas.
6. Valide que cada camada é testável isoladamente.

# Checklist
- [ ] Lógica central isolada de infraestrutura
- [ ] Uma preocupação por unidade
- [ ] Dependências em abstrações
- [ ] Entrada/saída separada da regra
- [ ] Fronteiras de camada explícitas
- [ ] Camadas testáveis isoladamente

# Anti-padrões
❌ Regra de negócio acoplada a detalhe de armazenamento
❌ Camada de apresentação contendo lógica central
❌ Mistura de validação, persistência e formatação no mesmo bloco
❌ Lógica central dependendo de detalhe concreto
❌ Fronteiras de camada difusas e implícitas
