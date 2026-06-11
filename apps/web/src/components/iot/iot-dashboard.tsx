"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Wifi, WifiOff, Battery, MapPin, AlertTriangle, Plus, Loader2,
  Bluetooth, Camera, Utensils, Droplets, Heart, Radio,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AIInsightsPanel } from "@/components/profile/shared/ai-insights-panel";
import { EcopetWatermark } from "@/components/brand/ecopet-symbol";
import { useCurrentUser } from "@/hooks/use-current-user";
import { petsApi } from "@/lib/pets/api";
import {
  fetchIotDashboard,
  registerIotDevice,
  simulateIotReading,
  type IotDeviceDto,
} from "@/lib/iot/api";
import { cn } from "@/lib/utils";

const typeIcons: Record<string, typeof Radio> = {
  collar: Bluetooth,
  camera: Camera,
  feeder: Utensils,
  water: Droplets,
  health: Heart,
  tracker: Radio,
  sensor: Radio,
};

const DEVICE_TYPES = [
  { id: "collar", label: "Coleira inteligente" },
  { id: "feeder", label: "Alimentador" },
  { id: "water", label: "Bebedouro" },
  { id: "health", label: "Monitor de saúde" },
  { id: "sensor", label: "Sensor ambiente" },
];

export function IoTDashboard() {
  const { token, user } = useCurrentUser();
  const [devices, setDevices] = useState<IotDeviceDto[]>([]);
  const [alerts, setAlerts] = useState<{ id: string; severity: string; message: string; device?: { name: string } }[]>([]);
  const [demoMode, setDemoMode] = useState(true);
  const [disclaimer, setDisclaimer] = useState("");
  const [loading, setLoading] = useState(true);
  const [pets, setPets] = useState<{ id: string; name: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", deviceType: "collar", petId: "" });
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const dash = await fetchIotDashboard(token);
      setDevices(dash.devices);
      setAlerts(dash.alerts);
      setDemoMode(dash.demoMode);
      setDisclaimer(dash.disclaimer);
    } catch {
      setError("Não foi possível carregar dispositivos IoT.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    void reload();
    petsApi(token).list().then((rows) => setPets(rows.map((p) => ({ id: p.id, name: p.name })))).catch(() => {});
  }, [token, reload]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !form.name.trim()) return;
    setBusy("register");
    try {
      await registerIotDevice(token, {
        name: form.name.trim(),
        deviceType: form.deviceType,
        ownerType: "pet",
        petId: form.petId || pets[0]?.id,
      });
      setShowForm(false);
      setForm({ name: "", deviceType: "collar", petId: "" });
      await reload();
    } catch {
      setError("Falha ao cadastrar dispositivo.");
    } finally {
      setBusy(null);
    }
  }

  async function handleSimulate(deviceId: string) {
    if (!token) return;
    setBusy(deviceId);
    try {
      await simulateIotReading(token, deviceId);
      await reload();
    } finally {
      setBusy(null);
    }
  }

  if (!user || !token) {
    return (
      <>
        <AppHeader title="IoT ECOPET" />
        <main className="mx-auto max-w-6xl flex-1 p-6 text-center text-sm text-ecopet-gray">
          Entre na sua conta para gerenciar dispositivos IoT do pet.
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader title="IoT ECOPET" />
      <main className="relative mx-auto max-w-6xl flex-1 p-4 lg:p-6 space-y-6">
        <EcopetWatermark />

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="heading-2">Central IoT do Pet</h1>
            <p className="secondary-text">Meu Pet → IoT · Monitoramento inteligente</p>
          </div>
          <Button onClick={() => setShowForm((v) => !v)} disabled={!pets.length}>
            <Plus className="h-4 w-4" /> Adicionar dispositivo
          </Button>
        </div>

        {demoMode && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
            <strong>Modo demonstração</strong> — leituras simuladas até conectar hardware real.
          </div>
        )}

        <p className="text-xs text-ecopet-gray">{disclaimer || "Os dados de IoT são indicadores preventivos e não substituem avaliação veterinária."}</p>

        {showForm && (
          <Card className="card-premium">
            <CardContent className="p-4 space-y-3">
              <h2 className="font-semibold">Cadastrar dispositivo</h2>
              <form onSubmit={handleRegister} className="grid gap-3 sm:grid-cols-2">
                <Input placeholder="Nome do dispositivo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                <select
                  className="rounded-md border px-3 py-2 text-sm"
                  value={form.deviceType}
                  onChange={(e) => setForm({ ...form, deviceType: e.target.value })}
                >
                  {DEVICE_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
                <select
                  className="rounded-md border px-3 py-2 text-sm sm:col-span-2"
                  value={form.petId}
                  onChange={(e) => setForm({ ...form, petId: e.target.value })}
                >
                  {pets.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <Button type="submit" disabled={busy === "register"} className="sm:col-span-2">
                  {busy === "register" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar dispositivo"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

        {alerts.length > 0 && (
          <Card className="card-premium border-amber-500/30">
            <CardContent className="p-4 space-y-2">
              <h2 className="section-title flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> Alertas</h2>
              {alerts.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl bg-amber-500/5 px-3 py-2 text-sm">
                  <span><strong>{a.device?.name ?? "Dispositivo"}</strong> — {a.message}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-ecopet-green" /></div>
        ) : devices.length === 0 ? (
          <Card className="card-premium border-dashed">
            <CardContent className="p-8 text-center text-sm text-ecopet-gray">
              Nenhum dispositivo cadastrado. Adicione uma coleira, alimentador ou sensor para começar o monitoramento.
            </CardContent>
          </Card>
        ) : (
          <div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {devices.map((device) => {
              const Icon = typeIcons[device.deviceType] ?? Radio;
              const online = device.status === "online";
              return (
                <Card key={device.id} className="card-premium">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ecopet-green/10">
                          <Icon className="h-5 w-5 text-ecopet-green" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{device.name}</h3>
                          <p className="caption-text">{device.pet?.name ?? "Pet vinculado"}</p>
                        </div>
                      </div>
                      {online ? <Wifi className="h-4 w-4 text-ecopet-green" /> : <WifiOff className="h-4 w-4 text-ecopet-gray" />}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {device.battery != null && <Badge variant="default" className="gap-1"><Battery className="h-3 w-3" /> {Math.round(device.battery)}%</Badge>}
                      {device.location && <Badge variant="default" className="gap-1"><MapPin className="h-3 w-3" /> {device.location.slice(0, 24)}</Badge>}
                      {device.isDemo && <Badge className="bg-amber-500/10 text-amber-700">Demo</Badge>}
                    </div>
                    <p className="mt-2 caption-text">
                      Sync: {device.lastSyncAt ? new Date(device.lastSyncAt).toLocaleString("pt-BR") : "—"}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full"
                      disabled={busy === device.id}
                      onClick={() => handleSimulate(device.id)}
                    >
                      {busy === device.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simular leitura"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <AIInsightsPanel
          title="Insights preventivos"
          insights={[
            { id: "1", title: "Atividade", description: "Mantenha rotina de exercícios conforme espécie e idade.", priority: "medium" },
            { id: "2", title: "Hidratação", description: "Monitore consumo de água — quedas abruptas merecem atenção.", priority: "high" },
          ]}
        />
      </main>
    </>
  );
}
