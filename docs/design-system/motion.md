# Motion

## Tokens

| Token | Valor |
|-------|-------|
| `--duration-fast` | 120ms |
| `--duration-normal` | 200ms |
| `--duration-slow` | 320ms |
| `--easing-standard` | `cubic-bezier(0.2, 0, 0, 1)` |
| `--easing-emphasized` | `cubic-bezier(0.2, 0, 0, 1.2)` |

## Microinterações permitidas

Hover, press (`scale` discreto), fade-in, scale-in, shimmer de skeleton, breathe do logo, abertura de dialog (existente).

## Proibido

Animações longas, parallax pesado, bounce excessivo, glow amarelo chamativo, atrasar interações.

## Acessibilidade

`prefers-reduced-motion: reduce` desativa animações em `motion.css`.
Framer Motion já existe no projeto — reutilizar com moderação; preferir CSS nesta fundação.
