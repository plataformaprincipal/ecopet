"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell, Calendar, ClipboardList, GitBranch, Play, Save, Ticket, Trash2, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createWorkflow, fetchWorkflows, fetchWorkflowById, updateWorkflow, runWorkflow,
} from "@/lib/platform/api";
import { cn } from "@/lib/utils";

export interface WorkflowNode {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  data?: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

const EVENT_OPTIONS = [
  { value: "stock.low", label: "Estoque mínimo atingido" },
  { value: "vaccine.due", label: "Vacina próxima do vencimento" },
  { value: "report.critical", label: "Denúncia crítica aberta" },
  { value: "ticket.created", label: "Ticket de suporte criado" },
  { value: "report.created", label: "Denúncia registrada" },
  { value: "manual", label: "Execução manual" },
];

const ACTION_PALETTE = [
  { type: "notify", label: "Enviar notificação", icon: Bell, color: "bg-blue-500" },
  { type: "create_task", label: "Criar tarefa", icon: ClipboardList, color: "bg-amber-500" },
  { type: "create_ticket", label: "Criar ticket", icon: Ticket, color: "bg-red-500" },
  { type: "notify_moderators", label: "Avisar moderadores", icon: Zap, color: "bg-purple-500" },
  { type: "calendar_event", label: "Evento na agenda", icon: Calendar, color: "bg-ecopet-green" },
];

const PERSONAS = ["GLOBAL", "CLIENT", "PARTNER", "NGO", "GESTOR"] as const;

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function defaultGraph(): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } {
  const triggerId = newId("trigger");
  return {
    nodes: [{
      id: triggerId,
      type: "trigger",
      label: "Quando",
      x: 80,
      y: 120,
      data: { eventType: "report.critical", triggerType: "event" },
    }],
    edges: [],
  };
}

function parseGraphFromWorkflow(wf: Record<string, unknown>) {
  const cfg = wf.triggerConfig as { nodes?: WorkflowNode[]; edges?: WorkflowEdge[] } | undefined;
  if (cfg?.nodes?.length) return { nodes: cfg.nodes, edges: cfg.edges ?? [] };
  const actions = (wf.actions as { type: string; label?: string; config?: Record<string, unknown> }[]) ?? [];
  const { nodes, edges } = defaultGraph();
  let prev = nodes[0].id;
  actions.forEach((a, i) => {
    const id = newId("action");
    nodes.push({ id, type: a.type, label: a.label ?? a.type, x: 280 + i * 200, y: 120, data: a.config });
    edges.push({ id: newId("edge"), source: prev, target: id });
    prev = id;
  });
  return { nodes, edges };
}

export function WorkflowVisualBuilder() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [workflows, setWorkflows] = useState<Record<string, unknown>[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("Novo workflow");
  const [description, setDescription] = useState("");
  const [personaScope, setPersonaScope] = useState<string>("GESTOR");
  const [nodes, setNodes] = useState<WorkflowNode[]>(() => defaultGraph().nodes);
  const [edges, setEdges] = useState<WorkflowEdge[]>(() => defaultGraph().edges);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; ox: number; oy: number } | null>(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadList = useCallback(() => {
    fetchWorkflows().then((w) => setWorkflows(w as Record<string, unknown>[])).catch(() => {});
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  function resetNew() {
    const g = defaultGraph();
    setEditId(null);
    setSelectedId(null);
    setName("Novo workflow");
    setDescription("");
    setPersonaScope("GESTOR");
    setNodes(g.nodes);
    setEdges(g.edges);
    setSelectedNode(null);
    setConnectFrom(null);
  }

  async function loadWorkflow(id: string) {
    const wf = await fetchWorkflowById(id) as Record<string, unknown>;
    setEditId(id);
    setSelectedId(id);
    setName(String(wf.name));
    setDescription(String(wf.description ?? ""));
    setPersonaScope(String(wf.personaScope));
    const g = parseGraphFromWorkflow(wf);
    setNodes(g.nodes);
    setEdges(g.edges);
  }

  function addActionNode(type: string, label: string) {
    const id = newId("action");
    setNodes((n) => [...n, { id, type, label, x: 300, y: 80 + n.length * 30, data: {} }]);
    setSelectedNode(id);
  }

  function removeNode(id: string) {
    if (nodes.find((n) => n.id === id)?.type === "trigger") return;
    setNodes((n) => n.filter((x) => x.id !== id));
    setEdges((e) => e.filter((x) => x.source !== id && x.target !== id));
    if (selectedNode === id) setSelectedNode(null);
  }

  function onNodeMouseDown(e: React.MouseEvent, node: WorkflowNode) {
    e.stopPropagation();
    setSelectedNode(node.id);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDragging({ id: node.id, ox: e.clientX - rect.left - node.x, oy: e.clientY - rect.top - node.y });
  }

  function onCanvasMouseMove(e: React.MouseEvent) {
    if (!dragging || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(20, e.clientX - rect.left - dragging.ox);
    const y = Math.max(20, e.clientY - rect.top - dragging.oy);
    setNodes((ns) => ns.map((n) => (n.id === dragging.id ? { ...n, x, y } : n)));
  }

  function onCanvasMouseUp() {
    setDragging(null);
  }

  function handleNodeClick(node: WorkflowNode) {
    if (connectFrom && connectFrom !== node.id) {
      const exists = edges.some((e) => e.source === connectFrom && e.target === node.id);
      if (!exists) {
        setEdges((e) => [...e, { id: newId("edge"), source: connectFrom, target: node.id }]);
      }
      setConnectFrom(null);
      return;
    }
    setSelectedNode(node.id);
  }

  function nodeById(id: string) {
    return nodes.find((n) => n.id === id);
  }

  function edgePath(source: WorkflowNode, target: WorkflowNode) {
    const x1 = source.x + 120;
    const y1 = source.y + 28;
    const x2 = target.x;
    const y2 = target.y + 28;
    const mx = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setMsg("");
    try {
      const payload = { name, description, personaScope, nodes, edges };
      if (editId) {
        await updateWorkflow(editId, { name, description, personaScope, visual: { nodes, edges } });
        setMsg("Workflow atualizado");
      } else {
        const created = await createWorkflow(payload) as { id: string };
        setEditId(created.id);
        setMsg("Workflow criado");
      }
      loadList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleRun() {
    if (!editId) return;
    await runWorkflow(editId);
    setMsg("Workflow executado");
  }

  const activeNode = selectedNode ? nodeById(selectedNode) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={resetNew}>Novo</Button>
        {workflows.map((w) => (
          <Button key={String(w.id)} size="sm" variant={selectedId === w.id ? "default" : "outline"} onClick={() => loadWorkflow(String(w.id))}>
            {String(w.name)}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[220px_1fr_260px]">
        <Card className="card-premium">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Quando → Então</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-ecopet-gray">Arraste ações para o canvas ou clique para adicionar.</p>
            {ACTION_PALETTE.map((a) => (
              <button
                key={a.type}
                type="button"
                draggable
                onDragEnd={() => addActionNode(a.type, a.label)}
                onClick={() => addActionNode(a.type, a.label)}
                className="flex w-full items-center gap-2 rounded-lg border border-ecopet-gray/15 p-2 text-left text-xs hover:border-ecopet-green/40"
              >
                <span className={cn("flex h-7 w-7 items-center justify-center rounded-md text-white", a.color)}>
                  <a.icon className="h-3.5 w-3.5" />
                </span>
                {a.label}
              </button>
            ))}
            <div className="border-t pt-2 text-xs text-ecopet-gray">
              <GitBranch className="mb-1 inline h-3.5 w-3.5" /> Modo conectar: selecione um nó e clique em &quot;Conectar&quot;, depois clique no destino.
            </div>
          </CardContent>
        </Card>

        <Card className="card-premium overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Canvas visual</CardTitle>
            <div className="flex gap-2">
              {selectedNode && (
                <Button size="sm" variant="outline" onClick={() => setConnectFrom(selectedNode)}>
                  {connectFrom === selectedNode ? "Cancelar" : "Conectar"}
                </Button>
              )}
              {editId && (
                <Button size="sm" variant="outline" onClick={handleRun}><Play className="mr-1 h-3.5 w-3.5" />Testar</Button>
              )}
              <Button size="sm" onClick={handleSave} disabled={saving}><Save className="mr-1 h-3.5 w-3.5" />{saving ? "..." : "Salvar"}</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div
              ref={canvasRef}
              className="relative h-[420px] overflow-auto bg-[radial-gradient(circle,_#e5e7eb_1px,_transparent_1px)] bg-[size:20px_20px] dark:bg-[radial-gradient(circle,_#374151_1px,_transparent_1px)]"
              onMouseMove={onCanvasMouseMove}
              onMouseUp={onCanvasMouseUp}
              onMouseLeave={onCanvasMouseUp}
            >
              <svg className="pointer-events-none absolute inset-0 h-full w-full min-w-[800px]">
                {edges.map((edge) => {
                  const s = nodeById(edge.source);
                  const t = nodeById(edge.target);
                  if (!s || !t) return null;
                  return (
                    <path key={edge.id} d={edgePath(s, t)} fill="none" stroke="currentColor" strokeWidth={2} className="text-ecopet-green/60" markerEnd="url(#arrow)" />
                  );
                })}
                <defs>
                  <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" className="fill-ecopet-green" />
                  </marker>
                </defs>
              </svg>

              {nodes.map((node) => {
                const palette = ACTION_PALETTE.find((p) => p.type === node.type);
                const isTrigger = node.type === "trigger";
                return (
                  <div
                    key={node.id}
                    role="button"
                    tabIndex={0}
                    onMouseDown={(e) => onNodeMouseDown(e, node)}
                    onClick={() => handleNodeClick(node)}
                    className={cn(
                      "absolute w-[120px] cursor-grab select-none rounded-xl border-2 bg-white p-2 shadow-md active:cursor-grabbing dark:bg-ecopet-dark-card",
                      selectedNode === node.id ? "border-ecopet-green ring-2 ring-ecopet-green/30" : "border-ecopet-gray/20",
                      connectFrom === node.id && "border-ecopet-yellow"
                    )}
                    style={{ left: node.x, top: node.y }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white text-[10px]", isTrigger ? "bg-ecopet-green" : palette?.color ?? "bg-gray-500")}>
                        {isTrigger ? <Zap className="h-3 w-3" /> : palette ? <palette.icon className="h-3 w-3" /> : "?"}
                      </span>
                      <span className="truncate text-[10px] font-semibold leading-tight">{node.label}</span>
                    </div>
                    {!isTrigger && (
                      <button type="button" className="absolute -right-2 -top-2 rounded-full bg-red-500 p-0.5 text-white" onClick={(e) => { e.stopPropagation(); removeNode(node.id); }}>
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="card-premium">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Propriedades</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Nome do workflow" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} />
            <select className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-ecopet-dark-card" value={personaScope} onChange={(e) => setPersonaScope(e.target.value)}>
              {PERSONAS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>

            {activeNode?.type === "trigger" && (
              <div>
                <label className="text-xs font-medium">Evento disparador</label>
                <select
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-ecopet-dark-card"
                  value={String(activeNode.data?.eventType ?? "manual")}
                  onChange={(e) => setNodes((ns) => ns.map((n) => n.id === activeNode.id ? { ...n, data: { ...n.data, eventType: e.target.value, triggerType: e.target.value === "manual" ? "manual" : "event" } } : n))}
                >
                  {EVENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            )}

            {activeNode && activeNode.type !== "trigger" && (
              <Input
                placeholder="Rótulo da ação"
                value={activeNode.label}
                onChange={(e) => setNodes((ns) => ns.map((n) => n.id === activeNode.id ? { ...n, label: e.target.value } : n))}
              />
            )}

            <div className="text-xs text-ecopet-gray">
              <p>Conexões: {edges.length}</p>
              <p>Nós: {nodes.length}</p>
            </div>

            {msg && <p className="text-sm text-ecopet-green">{msg}</p>}
            {error && <p className="text-sm text-red-500">{error}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function WorkflowCenterHub() {
  return (
    <div className="space-y-8">
      <WorkflowVisualBuilder />
    </div>
  );
}
