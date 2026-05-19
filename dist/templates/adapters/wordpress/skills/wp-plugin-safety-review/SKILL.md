---
name: wp-plugin-safety-review
description: Use ao revisar plugins/temas WordPress quanto a segurança, capabilities e dados do usuário.
category: adapter:wordpress
risk_level: high
---

# Objetivo
Evitar vulnerabilidades comuns em plugins/temas WordPress (autorização, CSRF, injeção).

# Quando usar
- Desenvolvimento ou alteração de plugin/tema.
- Endpoints AJAX/REST custom ou formulários no admin.
- Operações que gravam no banco ou no filesystem.

# Quando não usar
- Conteúdo apenas editorial sem código custom.
- Mudanças triviais de estilo sem lógica.

# Regras obrigatórias
- Verificar capability do usuário (`current_user_can`) antes de ações privilegiadas.
- Usar nonces (`wp_nonce_field`/`check_admin_referer`) em formulários e AJAX.
- Toda query ao banco com input deve usar `$wpdb->prepare`.
- Não confiar em `$_GET`/`$_POST`/`$_REQUEST` sem sanitização e validação.
- Não expor caminhos absolutos, segredos ou debug em produção.

# Processo
1. Liste pontos de entrada (AJAX, REST, admin-post, shortcodes).
2. Verifique capability check em cada ação sensível.
3. Confirme nonce em escrita/estado.
4. Revise queries com `$wpdb->prepare`.
5. Cheque sanitização de toda entrada externa.

# Checklist
- [ ] `current_user_can` em ações privilegiadas.
- [ ] Nonces em formulários/AJAX.
- [ ] `$wpdb->prepare` em queries com input.
- [ ] Entrada sanitizada e validada.
- [ ] Sem segredos/debug expostos.

# Anti-padrões
- AJAX handler sem nonce nem capability.
- `$wpdb->query("... $_POST[id] ...")` sem prepare.
- `eval`/`extract` sobre dados de requisição.
- `WP_DEBUG` ligado em produção.
