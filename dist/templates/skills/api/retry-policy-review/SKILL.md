---
name: retry-policy-review
description: Use ao revisar chamadas externas para política de retry, backoff e limites seguros.
category: api
risk_level: medium
---

# Objetivo
- Garantir que falhas transitórias sejam retentadas com segurança, sem amplificar carga ou duplicar efeitos.
- Equilibrar resiliência e proteção do sistema de destino.

# Quando usar
- Ao integrar chamadas a serviços externos ou internos sujeitos a falha.
- Ao adicionar ou alterar lógica de repetição.
- Antes de liberar fluxos críticos dependentes de rede.

# Quando não usar
- Projeto sem chamadas externas ou dependências de rede.
- Operação onde repetir é proibido por regra de negócio.

# Regras obrigatórias
- Só reentrar em erros transitórios; falhas definitivas não devem ser reentradas.
- Usar backoff incremental com teto, não repetição imediata em laço.
- Aplicar variação aleatória (jitter) para evitar sincronização de picos.
- Definir número máximo de tentativas e tempo total limite.
- Operações reentradas devem ser idempotentes ou protegidas contra duplicação.

# Processo
1. Classifique os erros possíveis em transitórios e definitivos.
2. Defina backoff base, fator de crescimento e teto.
3. Adicione jitter ao intervalo entre tentativas.
4. Estabeleça limite de tentativas e prazo total.
5. Garanta idempotência da operação reentrada.
6. Teste cenários de falha intermitente e indisponibilidade prolongada.

# Checklist
- [ ] Apenas erros transitórios são reentrados
- [ ] Backoff incremental com teto definido
- [ ] Jitter aplicado ao intervalo
- [ ] Limite de tentativas e prazo total definidos
- [ ] Operação reentrada é idempotente
- [ ] Falha definitiva tratada sem novas tentativas

# Anti-padrões
- ❌ Reentrar imediatamente em laço sem espera
- ❌ Repetir erro definitivo como autenticação inválida
- ❌ Retry infinito sem teto de tentativas
- ❌ Reentrar operação não idempotente sem proteção
- ❌ Backoff fixo igual para todos os clientes simultâneos
