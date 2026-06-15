# Acessibilidade — Auditoria Etapa 13

**Status:** preparado para auditoria WCAG — não certificado 100% WCAG 2.1 AA.

## Implementado

- VLibras ativo (widget gov.br)
- `aria-label` em formulário exclusão de conta
- `alt` em avatares sociais (Etapa 11)
- Labels em forms de login/cadastro
- Landmarks: `header`, `main`, `nav` no gestor
- Contraste: tema EcoPet green/dark

## Pendências críticas

- Auditoria formal de contraste em todos os componentes
- Skip links para conteúdo principal
- Foco visível em todos os controles custom
- Testes com leitor de tela (NVDA/VoiceOver)

## CSP e VLibras

CSP permite domínios VLibras — ver `docs/security/web-security.md`.

## Recomendação

Contratar auditoria WCAG antes de declaração pública de conformidade plena.
