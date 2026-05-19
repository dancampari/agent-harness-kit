---
name: clean-code-review
description: Use para revisar legibilidade, nomes, tamanho de funções e clareza geral do código antes de aprovar uma mudança.
category: engineering
risk_level: low
---

# Objetivo
Garantir que o código seja legível, previsível e fácil de manter, reduzindo carga cognitiva para quem ler depois.

# Quando usar
- Antes de aprovar um pull request ou commit relevante.
- Ao introduzir novo módulo, função ou fluxo.
- Quando um trecho precisa de comentário só para ser entendido.

# Quando não usar
- Em código gerado/temporário descartável (spikes, protótipos isolados).
- Quando a prioridade imediata é mitigar incidente em produção.
- Em arquivos de configuração puramente declarativos.

# Regras obrigatórias
- Nomes revelam intenção; sem abreviações ambíguas.
- Funções fazem uma coisa só e cabem na tela sem rolagem.
- Sem código morto, comentado ou duplicado.
- Aninhamento profundo substituído por retorno antecipado ou extração.
- Comentários explicam o "porquê", nunca o "o quê".

# Processo
1. Leia a mudança inteira antes de comentar pontos isolados.
2. Verifique nomes de variáveis, funções e tipos.
3. Avalie tamanho e responsabilidade de cada função.
4. Procure duplicação e oportunidades de extração.
5. Confirme que o fluxo é compreensível sem comentários extras.
6. Registre achados objetivos e priorizados.

# Checklist
- [ ] Nomes claros e consistentes
- [ ] Funções curtas e com responsabilidade única
- [ ] Sem duplicação evidente
- [ ] Sem código morto ou comentado
- [ ] Aninhamento controlado
- [ ] Comentários justificam decisões, não óbvio

# Anti-padrões
❌ Nomes genéricos como data, tmp, aux, foo
❌ Função gigante que mistura várias responsabilidades
❌ Comentar código em vez de removê-lo
❌ Copiar e colar blocos em vez de extrair
❌ Aninhar muitos níveis de condicional sem necessidade
