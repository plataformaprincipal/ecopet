"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { fetchCitiesByUf, filterCities } from "@/lib/address/brazilian-cities";
import { cn } from "@/lib/utils";

type Props = {
  id?: string;
  uf: string;
  value: string;
  onChange: (city: string) => void;
  error?: string;
  className?: string;
  describedBy?: string;
};

export function CityCombobox({ id, uf, value, onChange, error, className, describedBy }: Props) {
  const listId = useId();
  const [cities, setCities] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!uf || uf.length !== 2) {
      setCities([]);
      return;
    }
    let cancelled = false;
    setFailed(false);
    void fetchCitiesByUf(uf)
      .then((rows) => {
        if (cancelled) return;
        setCities(rows);
        setFailed(rows.length === 0);
      })
      .catch(() => {
        if (!cancelled) {
          setCities([]);
          setFailed(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [uf]);

  const suggestions = useMemo(() => filterCities(cities, value, 12), [cities, value]);

  return (
    <div className="relative">
      <Input
        id={id}
        className={cn(className, error && "border-red-500")}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        autoComplete="address-level2"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        aria-autocomplete="list"
        aria-controls={listId}
        placeholder={failed ? "Digite a cidade" : "Busque ou digite a cidade"}
      />
      {open && suggestions.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] py-1 text-sm shadow-lg"
        >
          {suggestions.map((city) => (
            <li key={city}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-[var(--ep-bg-muted)]"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(city);
                  setOpen(false);
                }}
              >
                {city}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
