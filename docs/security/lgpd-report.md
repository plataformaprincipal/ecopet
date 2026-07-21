# LGPD Report — EcoPet

**Data:** 2026-07-20  
**Escopo:** dados pessoais no produto implementado (código + checklist operacional)  
**Base legal / docs UX:** termos, privacidade, cookies (`/legal/*`, `/privacidade`, consent banner)

---

## Parecer

**Atendida no escopo de código implementado para homologação**, com pendências **operacionais** (retenção, DPO end-to-end) que **impedem** declarar conformidade plena de produção.

---

## 1. Inventário (dados pessoais tratados)

| Dado | Onde | Observação |
|------|------|------------|
| Nome, e-mail, telefone | User / registro | Consentimento no register (`lgpdAcceptedAt`) |
| CPF / CNPJ | Perfil partner/client | Mascarados em export e painéis admin |
| Endereço / cidade / UF | Perfil | Em export parcial |
| Pets | Relação owner | Ownership filtrado |
| Pedidos / valores | Orders | Export parcial |
| Posts sociais | Conteúdo do autor | Export limitado (100) |
| Tokens push FCM | Firebase devices | Desativação em exclusão/LGPD |
| Analytics / GTM | Browser | Consent Mode v2 default denied |
| Logs / Better Stack | Observability | Redaction de secrets/PII patterns |

---

## 2. Direitos do titular (implementação)

| Direito | Implementação | Status |
|---------|---------------|--------|
| Consentimento | Register + ConsentBanner + Consent Mode v2 | ✅ Código |
| Revogação | `/api/account/revoke-consent` + cliente analytics | ✅ Código |
| Acesso / exportação | `GET /api/account/export-data` → `exportUserData` (mascarado) | ✅ Parcial (nota DPO para completo) |
| Eliminação / anonimização | `DataPrivacyRequest` tipo `DELETE_ACCOUNT`; admin governance anonymize | ⚠ Fluxo request + processo MANUAL |
| Retificação | Tipo `RECTIFY` em privacy requests | ⚠ Processamento admin/DPO |
| Oposição / marketing | Consent analytics | ✅ Parcial |
| Portabilidade | Export JSON parcial | ✅ Parcial |

Painel admin: privacy requests (`PrivacyLgpdPanel` / admin privacy).

---

## 3. Checklist operacional (`getLgpdChecklist`)

| Item | Status checklist |
|------|------------------|
| Consent default denied | PASS |
| Banner consentimento | PASS |
| Sanitização GA | PASS |
| Sanitização GTM Data Layer | PASS |
| Sem warehouse Data Layer | PASS |
| Páginas privacidade | PASS |
| Revogação API | PASS |
| Processo DPO / pedidos | **MANUAL** |
| Política de retenção | **MANUAL** |

---

## 4. Logs, PII e correlation

| Controle | Status |
|----------|--------|
| Redaction secrets/Bearer/sk_ | ✅ observability unit |
| Correlation ID | ✅ |
| Hash de identificadores | ✅ |
| Better Stack em produção | ⚠ tokens ausentes no env auditado — configurar sem logar PII bruto |
| Health sem leak de host/env | ✅ hardening documentado |

---

## 5. Lacunas / riscos LGPD

| ID | Risco | Severidade | Correção |
|----|-------|------------|----------|
| LGPD-01 | Retenção de logs/audit não formalizada com prazo | Média | Política + job de purge documentado |
| LGPD-02 | Export “parcial” — titular pode precisar de processo DPO para completo | Média | SLA DPO + export completo sob demanda |
| LGPD-03 | DELETE_ACCOUNT depende de workflow humano | Média | Automatizar anonimização + evidência |
| LGPD-04 | Integrações (TalkJS, MP, Cloudinary, OpenAI) — subprocessadores | Média | DPAs + registro de operadores |
| LGPD-05 | CSP/analytics third-party (GA/GTM) | Baixa | Manter consent gate (já existe) |

---

## 6. Conclusão

Para **homologação**: controles técnicos essenciais presentes (consent, revoke, export mascarado, sanitize analytics, audit de privacy requests).  
Para **produção**: fechar itens MANUAL (retenção + DPO) e contratos com operadores; só então marcar LGPD como plenamente atendida no critério de go-live.
