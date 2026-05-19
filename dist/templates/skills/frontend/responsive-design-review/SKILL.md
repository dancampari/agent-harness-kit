---
name: responsive-design-review
description: Use ao revisar UI para garantir adaptação correta a diferentes tamanhos de tela.
category: frontend
risk_level: low
---

# Objetivo
- Garantir que a interface seja utilizável e legível em telas pequenas, médias e grandes.
- Evitar quebras de layout, conteúdo cortado ou rolagem horizontal indevida.

# Quando usar
- Ao criar ou alterar telas, listas, tabelas e formulários.
- Ao introduzir grids, colunas ou componentes com largura fixa.
- Antes de liberar mudanças visuais significativas.

# Quando não usar
- Projeto sem frontend.
- Ferramenta interna restrita a um único dispositivo fixo controlado.

# Regras obrigatórias
- O layout deve se adaptar por pontos de quebra, não por largura fixa rígida.
- Conteúdo essencial deve permanecer acessível sem rolagem horizontal.
- Áreas de toque devem ter tamanho confortável em telas pequenas.
- Imagens e mídia devem escalar sem distorção nem estouro do contêiner.
- Texto deve permanecer legível sem zoom forçado.

# Processo
1. Liste os pontos de quebra principais (pequeno, médio, grande).
2. Teste cada tela nos três tamanhos e em orientação retrato/paisagem.
3. Verifique tabelas e listas longas em telas estreitas.
4. Cheque alvos de toque e espaçamento em mobile.
5. Confirme que imagens e mídia escalam corretamente.
6. Corrija quebras e revalide.

# Checklist
- [ ] Sem rolagem horizontal indesejada
- [ ] Layout adapta nos pontos de quebra definidos
- [ ] Alvos de toque confortáveis no mobile
- [ ] Tabelas/listas usáveis em telas estreitas
- [ ] Imagens escalam sem distorção
- [ ] Texto legível sem zoom manual

# Anti-padrões
- ❌ Larguras fixas em pixels que não cabem em telas pequenas
- ❌ Tabela larga sem estratégia para mobile
- ❌ Botões minúsculos e colados em telas de toque
- ❌ Imagem com tamanho fixo estourando o contêiner
- ❌ Esconder conteúdo essencial só por falta de espaço
