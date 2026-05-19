---
name: data-flow-review
description: Use ao analisar como os dados entram, transformam, persistem e saem do sistema.
category: architecture
risk_level: medium
---

# Objetivo
Garantir que o fluxo de dados seja previsível, validado nas bordas e sem mutações ou perdas inesperadas.

# Quando usar
- Ao desenhar um novo pipeline ou fluxo de transformação.
- Ao revisar caminho de dados que cruza várias fronteiras.
- Quando há suspeita de inconsistência ou estado compartilhado.

# Quando não usar
- Em cálculo local trivial sem persistência ou fronteira.
- Em prototipagem isolada sem consumidores.
- Quando o fluxo é único, curto e sem transformação.

# Regras obrigatórias
- Dados validados ao entrar no sistema (borda de confiança).
- Transformações explícitas e rastreáveis.
- Estado mutável compartilhado evitado ou controlado.
- Origem da verdade única para cada dado.
- Falha de dados não corrompe estado persistido.

# Processo
1. Trace o caminho do dado da entrada até a saída.
2. Identifique pontos de validação e transformação.
3. Localize estado compartilhado e mutações.
4. Confirme uma única origem da verdade por dado.
5. Avalie integridade em cenários de falha.
6. Documente o fluxo e seus pontos de controle.

# Checklist
- [ ] Validação na borda de entrada
- [ ] Transformações explícitas e rastreáveis
- [ ] Sem estado mutável compartilhado descontrolado
- [ ] Origem da verdade única por dado
- [ ] Integridade preservada em falha
- [ ] Fluxo documentado

# Anti-padrões
❌ Confiar em dados externos sem validar
❌ Mutação oculta em estado compartilhado
❌ Mesma informação com fontes divergentes
❌ Transformação implícita e difícil de rastrear
❌ Falha parcial deixando dados persistidos inconsistentes
