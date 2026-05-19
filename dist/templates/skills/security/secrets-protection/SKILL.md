---
name: secrets-protection
description: Use ao manipular, armazenar ou transmitir credenciais, chaves, tokens ou qualquer dado sensível.
category: security
risk_level: high
---

# Objetivo
- Impedir exposição de segredos em código, logs, artefatos e histórico.
- Garantir rotação e revogação viáveis de credenciais.
- Centralizar a gestão de segredos fora do código-fonte.

# Quando usar
- Ao introduzir ou consumir chaves de API, senhas, tokens ou certificados.
- Ao configurar integração entre serviços ou ambientes.
- Ao revisar logs, mensagens de erro ou telemetria que possam vazar dados.

# Quando não usar
- Configurações públicas e não sensíveis (ex.: nomes de feature flags).
- Constantes sem valor de segurança e sem impacto em acesso.

# Regras obrigatórias
- Segredos vivem em um cofre/gerenciador, nunca no repositório.
- Nenhum segredo é registrado em logs, traces ou mensagens de erro.
- Segredos são injetados em tempo de execução, não embutidos em build.
- Toda credencial tem caminho claro de rotação e revogação.
- Acesso a segredos segue o menor privilégio e é auditável.

# Processo
1. Identificar todos os segredos envolvidos na mudança.
2. Confirmar origem dos segredos a partir de um gerenciador seguro.
3. Verificar que logs e erros não expõem valores sensíveis.
4. Validar mecanismo de rotação/revogação sem downtime crítico.
5. Revisar histórico de versionamento por segredos vazados.

# Checklist
- [ ] Nenhum segredo presente em código ou arquivos versionados.
- [ ] Segredos carregados de gerenciador seguro em runtime.
- [ ] Logs, traces e erros não contêm valores sensíveis.
- [ ] Rotação e revogação possíveis sem reescrever código.
- [ ] Acesso a segredos restrito e auditável.
- [ ] Histórico verificado contra vazamentos anteriores.

# Anti-padrões
❌ Commitar segredos "temporariamente" para testar.
❌ Logar payloads completos contendo tokens ou senhas.
❌ Embutir credenciais no artefato de build.
❌ Reutilizar a mesma credencial em múltiplos ambientes.
❌ Tratar segredo vazado apenas removendo o último commit.
