"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, MapPin, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FarmCard } from "./farm-card";
import { RealtimeMapMock } from "./realtime-map-mock";
import { ProductionChartMock } from "./production-chart-mock";
import { SensorCard } from "./sensor-card";
import { RobotCard } from "./robot-card";
import { fetchFarms, fetchPlots, fetchSensors, fetchRobots, fetchFarm } from "@/lib/agro/api";
import type { AgroFarm, AgroPlot, IoTSensor, AgroRobot } from "@/lib/agro/types";
import { formatHa } from "@/lib/agro/config";
import { EmptyState } from "@/components/ui/empty-state";
import { useTranslation } from "@/providers/i18n-provider";

export function AgroFarmsContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const farmId = searchParams.get("farm");
  const [farms, setFarms] = useState<AgroFarm[]>([]);
  const [selected, setSelected] = useState<AgroFarm | null>(null);
  const [plots, setPlots] = useState<AgroPlot[]>([]);
  const [sensors, setSensors] = useState<IoTSensor[]>([]);
  const [robots, setRobots] = useState<AgroRobot[]>([]);

  useEffect(() => {
    fetchFarms().then(setFarms);
  }, []);

  useEffect(() => {
    if (!farmId) {
      setSelected(null);
      return;
    }
    fetchFarm(farmId).then((f) => setSelected(f ?? null));
    Promise.all([fetchPlots(farmId), fetchSensors(farmId), fetchRobots(farmId)]).then(([p, s, r]) => {
      setPlots(p);
      setSensors(s);
      setRobots(r);
    });
  }, [farmId]);

  if (farmId && !selected) {
    return (
      <EmptyState
        icon={Sprout}
        title={t("empty.items.description")}
        description={t("empty.agro.noFarms")}
      />
    );
  }

  if (selected) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">{selected.name}</h1>
            <p className="flex items-center gap-1 text-ecopet-gray"><MapPin className="h-4 w-4" /> {selected.location}</p>
          </div>
          <Badge variant="premium">{selected.productivityIndex}% produtividade</Badge>
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border p-3 text-center"><p className="text-2xl font-bold text-ecopet-green">{formatHa(selected.totalAreaHa)}</p><p className="text-xs text-ecopet-gray">Área total</p></div>
          <div className="rounded-xl border p-3 text-center"><p className="text-2xl font-bold">{selected.sensorCount}</p><p className="text-xs text-ecopet-gray">Sensores</p></div>
          <div className="rounded-xl border p-3 text-center"><p className="text-2xl font-bold">{selected.robotCount}</p><p className="text-xs text-ecopet-gray">Robôs</p></div>
          <div className="rounded-xl border p-3 text-center"><p className="text-2xl font-bold">{selected.livestockCount}</p><p className="text-xs text-ecopet-gray">Rebanho</p></div>
        </div>
        <RealtimeMapMock />
        {plots.length === 0 ? (
          <EmptyState icon={Sprout} title={t("empty.items.description")} description={t("empty.agro.noPlots")} />
        ) : (
          <section>
            <h2 className="mb-3 font-semibold">Talhões</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {plots.map((p) => (
                <div key={p.id} className="rounded-xl border p-4">
                  <h3 className="font-semibold">{p.name}</h3>
                  <p className="text-sm text-ecopet-gray">{p.crop} · {p.stage}</p>
                  <p className="mt-1 text-sm">NDVI {p.ndvi} · {p.expectedYield} sc/ha</p>
                  <Badge className="mt-2" variant={p.risk === "high" ? "premium" : "default"}>Risco {p.risk}</Badge>
                </div>
              ))}
            </div>
          </section>
        )}
        <ProductionChartMock title="Produtividade histórica" data={[]} />
        <div className="grid gap-4 lg:grid-cols-2">
          <section>
            <h2 className="mb-3 font-semibold">Sensores</h2>
            {sensors.length === 0 ? (
              <p className="text-sm text-ecopet-gray">{t("empty.agro.noSensors")}</p>
            ) : (
              <div className="space-y-3">{sensors.slice(0, 3).map((s) => <SensorCard key={s.id} sensor={s} />)}</div>
            )}
          </section>
          <section>
            <h2 className="mb-3 font-semibold">Robôs</h2>
            {robots.length === 0 ? (
              <p className="text-sm text-ecopet-gray">{t("empty.agro.noRobots")}</p>
            ) : (
              <div className="space-y-3">{robots.map((r) => <RobotCard key={r.id} robot={r} />)}</div>
            )}
          </section>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-xl font-bold">Fazendas cadastradas</h1>
        <Button><Plus className="h-4 w-4" /> Nova fazenda</Button>
      </div>
      {farms.length === 0 ? (
        <EmptyState icon={Sprout} title={t("empty.agro.noFarms")} description={t("empty.agro.noFarmsHint")} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {farms.map((f) => <FarmCard key={f.id} farm={f} />)}
        </div>
      )}
    </div>
  );
}
