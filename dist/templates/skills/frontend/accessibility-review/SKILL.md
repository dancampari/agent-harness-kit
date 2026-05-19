---
name: accessibility-review
description: Use ao revisar UI para garantir acessibilidade a teclado, leitores de tela e contraste.
category: frontend
risk_level: medium
---

# Objetivo
- Garantir que a interface seja operável e perceptível por todas as pessoas, incluindo usuários de teclado e tecnologias assistivas.
- Reduzir barreiras de uso independentes de framework ou ausência dele.

# Quando usar
- Ao criar ou alterar componentes interativos (botões, campos, modais, menus).
- Ao revisar fluxos críticos (login, checkout, formulários longos).
- Antes de liberar mudanças visuais relevantes.

# Quando não usar
- Projeto sem frontend (apenas backend, CLI ou serviço sem UI).
- Protótipo descartável sem usuários reais.

# Regras obrigatórias
- Todo elemento interativo deve ser acessível e operável via teclado (foco visível e ordem lógica).
- Imagens informativas precisam de texto alternativo; imagens decorativas devem ser ignoradas por leitores de tela.
- Contraste de texto e componentes deve atender a um mínimo legível.
- Estados (erro, foco, selecionado) não podem depender só de cor.
- Use elementos semânticos ou papéis/rótulos equivalentes quando não houver semântica nativa.

# Processo
1. Navegue a tela inteira usando apenas o teclado.
2. Verifique foco visível e ordem de tabulação coerente.
3. Confira rótulos, textos alternativos e mensagens associadas aos campos.
4. Meça contraste de textos, ícones e bordas relevantes.
5. Teste com um leitor de tela os fluxos principais.
6. Registre e corrija as falhas encontradas.

# Checklist
- [ ] Toda interação funciona sem mouse
- [ ] Foco sempre visível e em ordem lógica
- [ ] Textos alternativos corretos para imagens
- [ ] Contraste mínimo atendido
- [ ] Informação não depende apenas de cor
- [ ] Campos têm rótulos e mensagens associadas

# Anti-padrões
- ❌ Botão construído sobre elemento não focável sem papel/rótulo
- ❌ Remover o indicador de foco sem fornecer substituto
- ❌ Indicar erro apenas mudando a cor da borda
- ❌ Imagens informativas sem texto alternativo
- ❌ Modal que não prende nem devolve o foco
