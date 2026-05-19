---
name: ci-cd-review
description: Use para revisar a saúde e a confiabilidade do pipeline de integração e entrega contínua.
category: operations
risk_level: medium
---

# Objetivo
Garantir que o pipeline automatizado valide a mudança de forma confiável, rápida o suficiente e sem pontos cegos antes da entrega.

# Quando usar
- Ao criar ou alterar etapas do pipeline.
- Quando builds ficam instáveis, lentos ou intermitentes.
- Antes de confiar no pipeline como porteiro de qualidade.
- Ao adicionar uma nova verificação obrigatória.

# Quando não usar
- Mudanças que não tocam configuração nem gatilhos do pipeline.
- Projetos sem automação onde isso é trabalho de outra etapa.
- Investigação local que não será integrada.

# Regras obrigatórias
- O pipeline deve falhar de forma clara quando uma verificação falha.
- Testes e checagens de qualidade obrigatórios devem rodar automaticamente.
- Builds não podem depender de estado manual ou ordem implícita.
- Segredos do pipeline devem vir de cofre, nunca do repositório.
- Falhas intermitentes devem ser investigadas, não reexecutadas às cegas.

# Processo
1. Liste as etapas do pipeline e o que cada uma garante.
2. Verifique se os gatilhos cobrem os eventos relevantes.
3. Confirme que checagens críticas são obrigatórias e bloqueantes.
4. Avalie tempo de execução e identifique gargalos.
5. Verifique o uso seguro de segredos e credenciais.
6. Investigue instabilidades até a causa raiz antes de reexecutar.

# Checklist
- [ ] Etapas e garantias mapeadas
- [ ] Gatilhos cobrem os eventos relevantes
- [ ] Checagens críticas obrigatórias e bloqueantes
- [ ] Tempo de execução aceitável e sem gargalos óbvios
- [ ] Segredos vindos de cofre, fora do repositório
- [ ] Instabilidades investigadas na causa raiz

# Anti-padrões
❌ Marcar checagens críticas como opcionais ou não bloqueantes
❌ Reexecutar pipeline até passar sem entender a falha
❌ Segredos versionados no repositório
❌ Pipeline que depende de passos manuais ou ordem implícita
❌ Pipeline tão lento que as pessoas o contornam
