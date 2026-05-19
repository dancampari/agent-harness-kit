---
name: complexity-review
description: Use para avaliar e reduzir complexidade desnecessária em código novo ou alterado.
category: quality
risk_level: low
---

# Objetivo
Manter o código compreensível identificando complexidade acidental e reduzindo-a sem perder clareza ou correção.

# Quando usar
- Ao revisar funções longas, aninhamento profundo ou muitos caminhos.
- Quando uma mudança aumenta ramificações ou responsabilidades.
- Antes de mesclar código que será mantido por outras pessoas.
- Quando a leitura do trecho exige esforço desproporcional.

# Quando não usar
- Complexidade essencial e irredutível do domínio, já bem isolada.
- Código gerado automaticamente que não é editado à mão.
- Trechos triviais que já são claros.

# Regras obrigatórias
- Uma função deve ter uma responsabilidade clara e nome coerente.
- Evite aninhamento profundo; prefira retornos antecipados e extração.
- Limite o número de caminhos lógicos por função ao mínimo necessário.
- Nomes devem revelar intenção, não exigir comentários explicativos.
- Reduções de complexidade não podem alterar o comportamento observável.

# Processo
1. Localize os trechos com maior carga cognitiva ou ramificação.
2. Avalie se a complexidade é essencial ou acidental.
3. Extraia blocos coesos em funções com nomes intencionais.
4. Achate aninhamentos com retornos antecipados ou guardas.
5. Simplifique condições e remova caminhos mortos.
6. Confirme com testes que o comportamento permanece idêntico.

# Checklist
- [ ] Funções com responsabilidade única
- [ ] Aninhamento profundo reduzido
- [ ] Caminhos lógicos minimizados
- [ ] Nomes revelam intenção sem depender de comentários
- [ ] Código morto removido
- [ ] Comportamento preservado e testado

# Anti-padrões
❌ Função que faz muitas coisas com nome genérico
❌ Aninhamento de condições além de poucos níveis
❌ Comentários longos para explicar código confuso em vez de simplificá-lo
❌ Abstrair cedo demais e criar complexidade nova
❌ Refatorar e alterar comportamento sem perceber
