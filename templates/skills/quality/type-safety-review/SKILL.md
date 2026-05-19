---
name: type-safety-review
description: Use para revisar se dados e contratos estão protegidos por tipos estáticos ou validação em runtime.
category: quality
risk_level: medium
---

# Objetivo
Garantir que valores e fronteiras do sistema sejam seguros: tipados estaticamente quando a linguagem permite, ou validados em runtime via contratos quando dinâmica.

# Quando usar
- Ao introduzir ou alterar fronteiras de dados (entrada externa, integrações, persistência).
- Ao revisar funções com muitos parâmetros ou estruturas complexas.
- Quando há conversões, parsing ou desserialização de dados.
- Ao expor uma interface pública consumida por outros módulos.

# Quando não usar
- Código interno simples sem fronteiras de dados não confiáveis.
- Ajustes que não alteram formatos, contratos ou tipos.
- Scripts efêmeros sem reuso nem entradas externas.

# Regras obrigatórias
- Em linguagens com tipos estáticos, evite tipos vagos ("qualquer"/dinâmico) sem justificativa.
- Em linguagens dinâmicas, valide toda entrada externa contra um contrato explícito.
- Toda fronteira não confiável (rede, arquivo, usuário) deve ser validada antes do uso.
- Conversões de tipo devem ser explícitas e tratar falhas.
- Contratos públicos devem ser documentados e estáveis.

# Processo
1. Identifique as fronteiras onde dados entram ou saem do módulo.
2. Para cada fronteira, defina o formato esperado de forma explícita.
3. Em código tipado, refine tipos vagos para tipos precisos.
4. Em código dinâmico, adicione validação de contrato na fronteira.
5. Garanta que falhas de validação sejam tratadas, não silenciadas.
6. Cubra os contratos com testes de dados válidos e inválidos.

# Checklist
- [ ] Fronteiras de dados identificadas
- [ ] Tipos precisos ou contratos explícitos em cada fronteira
- [ ] Entrada externa validada antes do uso
- [ ] Conversões explícitas com tratamento de erro
- [ ] Contratos públicos documentados e estáveis
- [ ] Testes para dados válidos e inválidos

# Anti-padrões
❌ Usar tipo dinâmico/"qualquer" para silenciar verificações
❌ Confiar em entrada externa sem validar o formato
❌ Conversões implícitas que falham silenciosamente
❌ Contratos públicos que mudam sem aviso aos consumidores
❌ Validar só o caminho feliz e ignorar dados malformados
