---
name: dependency-management
description: Use ao adicionar, atualizar ou remover dependências externas do projeto.
category: engineering
risk_level: medium
---

# Objetivo
Manter as dependências mínimas, atualizadas e auditáveis, reduzindo risco de segurança e de manutenção.

# Quando usar
- Antes de adicionar uma nova biblioteca de terceiros.
- Ao atualizar versões de dependências existentes.
- Em revisões periódicas de saúde do projeto.

# Quando não usar
- Para resolver um problema que cabe em poucas linhas próprias.
- Durante um hotfix urgente sem janela de validação.
- Quando a dependência ainda está em avaliação isolada (prova de conceito).

# Regras obrigatórias
- Justificar cada dependência por valor real e ausência de alternativa simples.
- Fixar versões de forma reprodutível (lock).
- Avaliar manutenção, licença e superfície de segurança antes de adotar.
- Atualizações testadas antes de mesclar.
- Remover dependências não utilizadas.

# Processo
1. Defina o problema e verifique se já existe solução interna.
2. Compare alternativas por tamanho, manutenção e licença.
3. Adote a opção mais simples que resolve o caso.
4. Fixe a versão e atualize o arquivo de lock.
5. Execute a suíte de verificação após a mudança.
6. Documente o motivo da escolha.

# Checklist
- [ ] Necessidade real justificada
- [ ] Alternativas comparadas
- [ ] Licença compatível verificada
- [ ] Versão fixada e lock atualizado
- [ ] Verificação executada após a mudança
- [ ] Dependências não usadas removidas

# Anti-padrões
❌ Adicionar biblioteca pesada para tarefa trivial
❌ Versões sem fixação (instável entre ambientes)
❌ Atualizar tudo de uma vez sem testar
❌ Ignorar licença ou estado de manutenção
❌ Deixar dependências órfãs no projeto
