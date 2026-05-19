---
name: security-review
description: Use ao revisar mudanças que possam introduzir vulnerabilidades de segurança no código ou na infraestrutura.
category: security
risk_level: high
---

# Objetivo
- Identificar e mitigar vulnerabilidades antes que cheguem a produção.
- Garantir que mudanças não enfraqueçam a postura de segurança existente.
- Tornar decisões de risco explícitas e rastreáveis.

# Quando usar
- Antes de mesclar mudanças que tocam autenticação, autorização ou dados sensíveis.
- Ao introduzir novas dependências, endpoints ou superfícies de entrada externas.
- Quando há manipulação de credenciais, criptografia ou comunicação entre serviços.

# Quando não usar
- Mudanças puramente cosméticas (formatação, renomeação interna sem efeito de runtime).
- Documentação ou comentários sem impacto em comportamento executável.

# Regras obrigatórias
- Nenhum segredo, token ou credencial em código, logs ou histórico de versionamento.
- Toda entrada externa é tratada como não confiável até validação explícita.
- Princípio do menor privilégio aplicado a serviços, contas e tokens.
- Falhas de segurança devem falhar de forma fechada (negar por padrão).
- Dependências novas ou atualizadas passam por verificação de vulnerabilidades conhecidas.

# Processo
1. Mapear a superfície de ataque afetada pela mudança (entradas, saídas, limites de confiança).
2. Revisar fluxo de autenticação e autorização impactado.
3. Verificar tratamento de segredos, dados sensíveis e criptografia.
4. Avaliar dependências e configurações introduzidas.
5. Registrar riscos residuais e decisões de aceitação.

# Checklist
- [ ] Nenhum segredo exposto em código, logs ou versionamento.
- [ ] Entradas externas validadas e tratadas como não confiáveis.
- [ ] Autenticação e autorização verificadas no caminho afetado.
- [ ] Erros de segurança falham fechados, sem vazar detalhes internos.
- [ ] Dependências verificadas quanto a vulnerabilidades conhecidas.
- [ ] Riscos residuais documentados e aceitos conscientemente.

# Anti-padrões
❌ Confiar em entrada de cliente sem revalidar no servidor.
❌ Esconder segredos apenas via ofuscação ou variáveis "internas".
❌ Tratar exceções de segurança de forma permissiva (falhar aberto).
❌ Adicionar dependências sem avaliar histórico de vulnerabilidades.
❌ Adiar revisão de segurança para "depois do deploy".
