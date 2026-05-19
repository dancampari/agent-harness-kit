---
name: wp-hooks-and-sanitization-review
description: Use ao revisar uso de actions/filters e sanitização/escape de saída no WordPress.
category: adapter:wordpress
risk_level: medium
---

# Objetivo
Garantir uso idiomático de hooks do WordPress e escape/sanitização corretos de dados.

# Quando usar
- Registro de `add_action`/`add_filter` ou filtros custom.
- Renderização de conteúdo dinâmico em templates.
- Salvamento de opções, meta ou settings.

# Quando não usar
- HTML estático sem dados dinâmicos.
- Mudanças não relacionadas a hooks/saída.

# Regras obrigatórias
- Sanitizar na entrada (`sanitize_text_field`, `absint`, etc.) e escapar na saída (`esc_html`, `esc_attr`, `esc_url`).
- Filtros devem retornar o valor (não apenas modificar por efeito colateral).
- Prioridade e número de argumentos de hooks devem ser corretos.
- Não remover/duplicar hooks de terceiros sem necessidade documentada.
- Usar a Settings API para opções em vez de gravação direta sem validação.

# Processo
1. Mapeie hooks adicionados e suas assinaturas.
2. Verifique retorno correto em filtros.
3. Confirme sanitização na entrada e escape na saída.
4. Cheque prioridade/args em `add_action`/`add_filter`.
5. Revise persistência de opções via Settings API.

# Checklist
- [ ] Sanitização na entrada.
- [ ] Escape na saída conforme contexto.
- [ ] Filtros retornam valor.
- [ ] Prioridade/args corretos.
- [ ] Settings API para opções.

# Anti-padrões
- `echo $meta` sem `esc_html`.
- Filtro que não retorna valor.
- `add_filter` com nº de args errado, perdendo parâmetros.
- `update_option` com dado de requisição sem validar.
