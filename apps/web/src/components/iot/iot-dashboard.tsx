"use client";

import {
  Wifi, WifiOff, Battery, MapPin, AlertTriangle, Plus,
  Bluetooth, Camera, Utensils, Droplets, Scale, Heart, Radio,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AIInsightsPanel } from "@/components/profile/shared/ai-insights-panel";
import { EcopetWatermark } from "@/components/brand/ecopet-symbol";
import { IOT_DEVICES, IOT_ALERTS, IOT_CATEGORIES } from "@/lib/iot/mock-data";
import { cn } from "@/lib/utils";

const typeIcons = {
  collar: Bluetooth,
  camera: Camera,
  feeder: Utensils,
  water: Droplets,
  scale: Scale,
  health: Heart,
  tracker: Radio,
  sensor: Radio,
};

const statusColors = {
  online: "text-ecopet-green",
  offline: "text-ecopet-gray",
  warning: "text-amber-500",
};

export function IoTDashboard() {
  return (
    <>
      <AppHeader title="IoT ECOPET" />
      <main className="relative mx-auto max-w-6xl flex-1 p-4 lg:p-6 space-y-6">
        <EcopetWatermark />

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="heading-2">Central IoT</h1>
            <p className="secondary-text">Dispositivos conectados · Monitoramento inteligente</p>
          </div>
          <Button><Plus className="h-4 w-4" /> Adicionar dispositivo</Button>
        </div>

        {/* Categorias */}
        <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {IOT_CATEGORIES.map((cat) => (
            <Card key={cat.id} className="card-premium cursor-pointer text-center">
              <CardContent className="p-3">
                <p className="font-display text-lg font-extrabold">{cat.count}</p>
                <p className="caption-text">{cat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Alertas */}
        {IOT_ALERTS.length > 0 && (
          <Card className="card-premium border-amber-500/30">
            <CardContent className="p-4 space-y-2">
              <h2 className="section-title flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> Alertas</h2>
              {IOT_ALERTS.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl bg-amber-500/5 px-3 py-2 text-sm">
                  <span><strong>{a.device}</strong> — {a.message}</span>
                  <span className="caption-text">{a.time}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Dispositivos */}
        <div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {IOT_DEVICES.map((device) => {
            const Icon = typeIcons[device.type] ?? Radio;
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
                        <p className="caption-text">{device.petName}</p>
                      </div>
                    </div>
                    {device.status === "online" ? (
                      <Wifi className={cn("h-4 w-4", statusColors.online)} />
                    ) : device.status === "warning" ? (
                      <AlertTriangle className={cn("h-4 w-4", statusColors.warning)} />
                    ) : (
                      <WifiOff className={cn("h-4 w-4", statusColors.offline)} />
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="default" className="gap-1"><Battery className="h-3 w-3" /> {device.battery}%</Badge>
                    <Badge variant="default" className="gap-1"><MapPin className="h-3 w-3" /> {device.location.slice(0, 20)}</Badge>
                    {device.alerts > 0 && <Badge className="bg-amber-500/10 text-amber-600">{device.alerts} alerta(s)</Badge>}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(device.metrics).slice(0, 4).map(([k, v]) => (
                      <div key={k} className="rounded-lg bg-ecopet-gray/5 px-2 py-1.5 dark:bg-white/5">
                        <span className="text-ecopet-gray capitalize">{k}: </span>
                        <span className="font-semibold">{String(v)}</span>
                      </div>
                    ))}
                  </div>

                  <p className="mt-2 caption-text">Sync: {device.lastSync}</p>
                  <Button variant="outline" size="sm" className="mt-3 w-full">Ver detalhes</Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <AIInsightsPanel
          title="IA IoT ECOPET"
          insights={[
            { id: "i1", title: "Hidratação Thor", description: "Consumo 15% abaixo da média — verificar bebedouro.", tag: "Saúde", priority: "medium" },
            { id: "i2", title: "Atividade Luna", description: "8.540 passos — meta diária atingida ✓", tag: "Atividade", priority: "low" },
            { id: "i3", title: "Previsão manutenção", description: "Balança offline — substituir pilhas em 48h.", tag: "Dispositivo", priority: "high" },
          ]}
        />
      </main>
    </>
  );
}
