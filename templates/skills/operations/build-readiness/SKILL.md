---
name: build-readiness
description: Use para confirmar que o projeto compila e empacota de forma limpa e reproduzível antes de avançar.
category: operations
risk_level: medium
---

# Objetivo
Garantir que o artefato de build seja produzido de forma limpa, reproduzível e sem avisos críticos antes de seguir para integração ou entrega.

# Quando usar
- Antes de abrir ou mesclar uma mudança que afeta o build.
- Após alterar dependências, configuração de build ou estrutura do projeto.
- Quando o build local diverge do ambiente de integração.
- Antes de preparar um artefato para distribuição.

# Quando não usar
- Mudanças apenas em documentação que não entram no artefato.
- Investigação exploratória sem intenção de entregar.
- Quando outra skill de entrega já cobriu o build recentemente sem mudanças.

# Regras obrigatórias
- O build deve rodar a partir de um estado limpo, sem artefatos antigos.
- Dependências devem ser resolvidas de forma determinística e fixada.
- Avisos críticos do build devem ser tratados, não ignorados.
- O comando de build deve ser documentado e reproduzível por terceiros.
- Segredos não podem ser embutidos no artefato gerado.

# Processo
1. Limpe artefatos e caches que possam mascarar problemas.
2. Resolva dependências a partir das versões fixadas.
3. Execute o build completo do início ao fim.
4. Revise a saída em busca de erros e avisos críticos.
5. Verifique o artefato gerado e a ausência de segredos.
6. Documente ou confirme o comando reproduzível de build.

# Checklist
- [ ] Build executado a partir de estado limpo
- [ ] Dependências determinísticas e fixadas
- [ ] Sem erros e sem avisos críticos
- [ ] Artefato gerado e validado
- [ ] Nenhum segredo embutido no artefato
- [ ] Comando de build reproduzível e documentado

# Anti-padrões
❌ Confiar em build incremental sobre caches sujos
❌ Ignorar avisos críticos por "sempre apareceram"
❌ Dependências sem versão fixada que mudam silenciosamente
❌ Build que só funciona na máquina de quem o escreveu
❌ Embutir credenciais no artefato final
