---
name: deployment-readiness
description: Use antes de promover uma mudança para produção para confirmar que ela é segura de implantar e reverter.
category: operations
risk_level: high
---

# Objetivo
Confirmar que a mudança pode ser implantada em produção com risco controlado, plano de reversão e impacto previsível.

# Quando usar
- Antes de qualquer promoção para um ambiente produtivo.
- Ao implantar mudanças de migração, configuração ou contrato.
- Quando a mudança afeta usuários reais ou dados persistentes.
- Antes de janelas de entrega de alto risco.

# Quando não usar
- Trabalho em ambientes não produtivos descartáveis.
- Mudanças sem efeito em runtime que não são implantadas.
- Quando outra equipe ou processo é o dono explícito da implantação.

# Regras obrigatórias
- Toda implantação deve ter um plano de reversão testável.
- Migrações de dados devem ser reversíveis ou compatíveis com versões anteriores.
- Configuração e segredos do destino devem estar validados antes de promover.
- O impacto e o público afetado devem ser conhecidos antes de iniciar.
- Deve existir forma de detectar falha logo após a implantação.

# Processo
1. Revise o escopo da mudança e o público impactado.
2. Confirme que build e verificações de qualidade passaram.
3. Valide configuração e segredos do ambiente de destino.
4. Defina e verifique o plano de reversão.
5. Garanta compatibilidade de migrações com a versão anterior.
6. Estabeleça como monitorar a saúde imediatamente após a implantação.

# Checklist
- [ ] Escopo e público impactado conhecidos
- [ ] Build e verificações de qualidade aprovados
- [ ] Configuração e segredos do destino validados
- [ ] Plano de reversão definido e testável
- [ ] Migrações reversíveis ou retrocompatíveis
- [ ] Monitoramento pós-implantação preparado

# Anti-padrões
❌ Implantar sem plano de reversão
❌ Migração irreversível sem janela de compatibilidade
❌ Promover com configuração ou segredos não verificados
❌ Não saber quem é afetado pela mudança
❌ Implantar e não observar a saúde logo em seguida
