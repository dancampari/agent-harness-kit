---
name: input-validation
description: Use ao receber dados externos para garantir validação, sanitização e tratamento seguro de entrada.
category: security
risk_level: high
---

# Objetivo
- Tratar toda entrada externa como não confiável até validação.
- Prevenir injeção, corrupção de estado e comportamento inesperado.
- Garantir mensagens de erro seguras e previsíveis.

# Quando usar
- Ao processar requisições, parâmetros, payloads, arquivos ou mensagens.
- Ao integrar com sistemas externos que enviam dados.
- Ao desserializar ou interpretar conteúdo de origem não confiável.

# Quando não usar
- Dados totalmente internos e já validados em fronteira anterior confiável.
- Constantes definidas em código sem origem externa.

# Regras obrigatórias
- Validar tipo, formato, faixa e tamanho antes de usar qualquer entrada.
- Usar listas de permissão em vez de listas de bloqueio quando possível.
- Sanitizar ou parametrizar dados antes de consultas, comandos ou renderização.
- Rejeitar entrada inválida explicitamente, sem coerção silenciosa perigosa.
- Mensagens de erro não revelam detalhes internos sensíveis.

# Processo
1. Identificar todos os pontos de entrada externos da mudança.
2. Definir o contrato esperado (tipo, formato, limites) de cada campo.
3. Validar na fronteira antes de propagar para a lógica interna.
4. Parametrizar/escapar dados ao cruzar limites (consulta, comando, saída).
5. Padronizar respostas de erro sem vazar informação interna.

# Checklist
- [ ] Toda entrada externa identificada e validada na fronteira.
- [ ] Tipo, formato, faixa e tamanho verificados.
- [ ] Listas de permissão usadas onde aplicável.
- [ ] Dados parametrizados/escapados antes de consultas ou comandos.
- [ ] Entrada inválida rejeitada explicitamente.
- [ ] Erros não expõem detalhes internos sensíveis.

# Anti-padrões
❌ Concatenar entrada diretamente em consultas ou comandos.
❌ Confiar em validação apenas no cliente.
❌ Coagir silenciosamente valores inválidos para "padrões".
❌ Usar somente listas de bloqueio para conteúdo perigoso.
❌ Retornar stack traces ou detalhes internos em erros.
