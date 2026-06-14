"use client";

import { CloudSun, Droplets, Wind, Thermometer, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { WeatherForecast } from "@/lib/agro/types";

interface WeatherPanelProps {
  weather: WeatherForecast;
}

export function WeatherPanel({ weather }: WeatherPanelProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-ecopet-gray/10 p-3 text-center">
          <Thermometer className="mx-auto h-5 w-5 text-red-500" />
          <p className="mt-1 text-xl font-bold">{weather.current.temp}°C</p>
          <p className="text-xs text-ecopet-gray">Temperatura</p>
        </div>
        <div className="rounded-xl border border-ecopet-gray/10 p-3 text-center">
          <Droplets className="mx-auto h-5 w-5 text-blue-500" />
          <p className="mt-1 text-xl font-bold">{weather.current.humidity}%</p>
          <p className="text-xs text-ecopet-gray">Umidade</p>
        </div>
        <div className="rounded-xl border border-ecopet-gray/10 p-3 text-center">
          <Wind className="mx-auto h-5 w-5 text-ecopet-gray" />
          <p className="mt-1 text-xl font-bold">{weather.current.wind} km/h</p>
          <p className="text-xs text-ecopet-gray">Vento</p>
        </div>
        <div className="rounded-xl border border-ecopet-gray/10 p-3 text-center">
          <CloudSun className="mx-auto h-5 w-5 text-ecopet-yellow" />
          <p className="mt-1 text-xl font-bold">{weather.current.rain} mm</p>
          <p className="text-xs text-ecopet-gray">Chuva hoje</p>
        </div>
      </div>
      <div>
        <h4 className="mb-2 text-sm font-semibold">Previsão 5 dias</h4>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {weather.forecast.map((d) => (
            <div key={d.day} className="min-w-[80px] shrink-0 rounded-xl border border-ecopet-gray/10 p-3 text-center text-xs">
              <p className="font-semibold">{d.day}</p>
              <p className="mt-1">{d.tempMax}°/{d.tempMin}°</p>
              <p className="text-blue-500">{d.rain}% chuva</p>
              <Badge variant="default" className="mt-1 text-[9px]">{d.risk}</Badge>
            </div>
          ))}
        </div>
      </div>
      {weather.alerts.length > 0 && (
        <div>
          <h4 className="mb-2 flex items-center gap-1 text-sm font-semibold"><AlertTriangle className="h-4 w-4 text-amber-500" /> Alertas por talhão</h4>
          <div className="space-y-2">
            {weather.alerts.map((a, i) => (
              <div key={i} className="rounded-xl bg-amber-500/10 p-3 text-sm">
                <strong>{a.type}</strong> — {a.plot}: {a.impact}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
