---
name: psr-standards-review
description: Use ao revisar conformidade com PSR-1/4/12, namespaces e estilo de código PHP.
category: adapter:php
risk_level: low
---

# Objetivo
Assegurar que o código PHP siga padrões PSR de estilo, autoload e estrutura.

# Quando usar
- Novas classes/namespaces ou reorganização de diretórios.
- Revisão de estilo de código (PSR-12).
- Configuração de PHP_CodeSniffer/PHP-CS-Fixer.

# Quando não usar
- Scripts legados isolados sem intenção de padronização.
- Mudanças triviais não relacionadas a estilo/estrutura.

# Regras obrigatórias
- Namespace deve mapear o caminho de diretório conforme PSR-4.
- Um arquivo por classe; nome do arquivo igual ao nome da classe.
- Seguir PSR-12: indentação, chaves, visibilidade explícita em métodos/propriedades.
- Declarar `declare(strict_types=1)` quando o projeto adotar tipagem estrita.
- Sem efeitos colaterais em arquivos que apenas declaram símbolos.

# Processo
1. Confira correspondência namespace ↔ diretório (PSR-4).
2. Valide um símbolo por arquivo.
3. Revise estilo PSR-12 (chaves, espaçamento, visibilidade).
4. Verifique `strict_types` conforme convenção do projeto.
5. Garanta separação entre declaração e execução.

# Checklist
- [ ] Namespace conforme PSR-4.
- [ ] Uma classe por arquivo.
- [ ] Estilo PSR-12 respeitado.
- [ ] Visibilidade explícita.
- [ ] Sem side effects em arquivos de declaração.

# Anti-padrões
- Lógica executável no topo de arquivo de classe.
- Métodos sem modificador de visibilidade.
- Namespace divergente da estrutura de pastas.
- Múltiplas classes públicas no mesmo arquivo.
