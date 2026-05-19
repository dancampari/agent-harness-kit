---
name: migration-safety
description: Use ao criar ou revisar migrations de esquema/dados para garantir aplicação segura e reversível.
category: data
risk_level: high
---

# Objetivo
- Garantir que migrations sejam seguras, reversíveis e sem perda de dados.
- Evitar indisponibilidade e bloqueios prolongados durante a aplicação.
- Manter compatibilidade entre versões de código e esquema.

# Quando usar
- Ao adicionar, alterar ou remover estruturas de dados.
- Ao realizar backfill ou transformação de dados em massa.
- Ao coordenar mudanças de esquema com deploy de código.

# Quando não usar
- Mudanças sem alteração de esquema ou de dados persistidos.
- Ajustes locais de desenvolvimento sem efeito em ambientes compartilhados.

# Regras obrigatórias
- Toda migration tem caminho de reversão ou plano de recuperação claro.
- Mudanças destrutivas são separadas e executadas em etapas controladas.
- Migrations são compatíveis com a versão de código anterior e a nova.
- Operações em massa evitam bloqueios longos e são executadas em lotes.
- Backup ou ponto de recuperação verificado antes de mudanças destrutivas.

# Processo
1. Classificar a migration (aditiva, transformadora, destrutiva).
2. Garantir compatibilidade retroativa durante o período de transição.
3. Planejar backfill em lotes, idempotente e retomável.
4. Definir e testar o procedimento de reversão/recuperação.
5. Validar a migration em ambiente representativo antes de produção.

# Checklist
- [ ] Tipo da migration identificado e tratado adequadamente.
- [ ] Compatível com a versão de código anterior e a nova.
- [ ] Mudanças destrutivas isoladas e faseadas.
- [ ] Backfill em lotes, idempotente e retomável.
- [ ] Plano de reversão/recuperação testado.
- [ ] Backup/ponto de recuperação confirmado antes de destruir dados.

# Anti-padrões
❌ Remover ou renomear estrutura no mesmo passo que o código que a usa.
❌ Backfill em uma única operação massiva sem lotes.
❌ Migration sem qualquer caminho de reversão ou recuperação.
❌ Aplicar mudança destrutiva sem backup verificado.
❌ Testar a migration somente em produção.
