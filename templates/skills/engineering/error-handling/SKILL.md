---
name: error-handling
description: Use ao projetar ou revisar como o código detecta, propaga e trata falhas.
category: engineering
risk_level: medium
---

# Objetivo
Tornar o tratamento de erros explícito, previsível e seguro, evitando falhas silenciosas e estados inconsistentes.

# Quando usar
- Ao integrar com recursos externos sujeitos a falha.
- Ao revisar fluxos com entrada não confiável.
- Quando há captura genérica de exceções no código.

# Quando não usar
- Em scripts descartáveis de uso único e isolado.
- Quando a falha deve realmente derrubar o processo de forma controlada.
- Para validações triviais já cobertas por contrato de tipo.

# Regras obrigatórias
- Não engolir erros silenciosamente.
- Capturar apenas o que sabe tratar; o resto propaga.
- Mensagens de erro úteis, sem expor dados sensíveis.
- Recursos liberados mesmo em caminho de falha.
- Estado consistente após erro (sem efeitos parciais).

# Processo
1. Mapeie pontos de falha do fluxo.
2. Decida tratar localmente ou propagar para a borda.
3. Garanta liberação de recursos em qualquer caminho.
4. Defina mensagens claras e seguras.
5. Assegure consistência do estado após falha.
6. Verifique os caminhos de erro, não só o feliz.

# Checklist
- [ ] Nenhum erro engolido em silêncio
- [ ] Captura específica, não genérica indiscriminada
- [ ] Recursos sempre liberados
- [ ] Mensagens úteis e sem dado sensível
- [ ] Estado consistente após falha
- [ ] Caminhos de erro testados

# Anti-padrões
❌ Bloco de captura vazio
❌ Capturar tudo e continuar como se nada ocorresse
❌ Vazar stack trace ou dados sensíveis ao usuário
❌ Deixar recurso aberto no caminho de falha
❌ Confundir condição esperada com exceção catastrófica
