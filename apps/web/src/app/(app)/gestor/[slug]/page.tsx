"use client";

import { GESTOR_MODULES } from "@/lib/gestor/config";
import { GestorPageHeader } from "@/components/gestor/gestor-shell";
import { GestorModuleView } from "@/components/gestor/gestor-module-view";

const DESCRIPTIONS: Record<string, string> = {
  financeiro: "Fluxo de caixa, Saldo ECOPET, reembolsos, comissões, DRE e projeções.",
  contabil: "Obrigações fiscais, categorias contábeis e exportações.",
  marketing: "Campanhas, CRM, leads, funis e automações.",
  vendas: "Pipeline comercial, metas, conversão e propostas.",
  qualidade: "Auditorias, reclamações, SLA e ranking de parceiros.",
  design: "Biblioteca visual, assets e identidade ECOPET.",
  projetos: "Roadmap, cronogramas e novos módulos.",
  empresa: "Setores internos da ECOPET — financeiro, TI, RH, jurídico e mais.",
  administrativo: "Processos internos, tarefas e protocolos.",
  ti: "APIs, integrações, logs, performance e segurança.",
  inovacao: "Laboratório experimental — IA, IoT, robôs e AgroPet.",
  juridico: "Contratos, LGPD, compliance e auditoria jurídica.",
  rh: "Equipe ECOPET, cargos, permissões e onboarding.",
  marketplace: "Produtos, serviços, orçamentos e pedidos.",
  robos: "Central de robôs operacionais 24h.",
  notificacoes: "Central global — push, e-mail, WhatsApp e segmentação.",
  documentos: "Central documental — parceiros, ONGs, clientes e gestor.",
  denuncias: "Triagem, classificação de risco e moderação com IA.",
  parceiros: "Gestão de parceiros — aprovação, documentação e desempenho.",
  chats: "Conversas integradas — clientes, parceiros, ONGs e equipe.",
  iot: "Monitoramento de dispositivos, sensores e alertas.",
  bi: "Business Intelligence — métricas internas e externas.",
  configuracoes: "Usuários internos, permissões, segurança e LGPD.",
  sistema: "Health check, backups, status de API e erros críticos.",
};

export default function GestorModulePage({ params }: { params: { slug: string } }) {
  const mod = GESTOR_MODULES.find((m) => m.id === params.slug);
  if (!mod) {
    return <GestorPageHeader title="Módulo não encontrado" />;
  }

  return (
    <>
      <GestorPageHeader title={mod.label} description={DESCRIPTIONS[params.slug]} />
      <GestorModuleView moduleId={params.slug} title={mod.label} description={DESCRIPTIONS[params.slug]} />
    </>
  );
}
