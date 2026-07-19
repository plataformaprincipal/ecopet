"use client";

import { useState } from "react";
import {
  AddressByCepField,
  type AddressByCepFieldProps,
  type AddressByCepValue,
} from "@/components/shared/address/address-by-cep-field";
import { AddressAutocomplete } from "@/components/maps/address-autocomplete";
import { AddressMapPicker } from "@/components/maps/address-map-picker";
import { structuredToAddressByCepFields } from "@/lib/google-maps/places";
import { mergeAddress } from "@/lib/address/cep-service";
import { isGoogleMapsClientReady } from "@/lib/google-maps/config";
import { useTranslation } from "@/providers/i18n-provider";
import type { StructuredAddress } from "@/lib/google-maps/types";

/**
 * Formulário de endereço reutilizável:
 * ViaCEP (sempre) + Places Autocomplete + mapa (quando Google configurado).
 * Endereço manual continua válido sem Google.
 */
export function AddressFormWithMaps({
  value,
  onChange,
  showMap = true,
  ...rest
}: AddressByCepFieldProps & { showMap?: boolean }) {
  const { t } = useTranslation();
  const [showPicker, setShowPicker] = useState(false);
  const mapsReady = isGoogleMapsClientReady();

  function applyStructured(addr: StructuredAddress, replaceFields = true) {
    const mapped = structuredToAddressByCepFields(addr);
    if (replaceFields) {
      onChange(
        mergeAddress(value, {
          ...mapped,
          number: mapped.number || value.number,
          complement: mapped.complement || value.complement,
        })
      );
    } else {
      onChange(
        mergeAddress(value, {
          latitude: mapped.latitude,
          longitude: mapped.longitude,
        })
      );
    }
  }

  return (
    <div className="space-y-4">
      {mapsReady ? (
        <AddressAutocomplete
          onSelect={(addr) => {
            applyStructured(addr, true);
            setShowPicker(true);
          }}
        />
      ) : null}

      <AddressByCepField value={value} onChange={onChange} {...rest} />

      {mapsReady && showMap ? (
        <div className="space-y-2">
          <button
            type="button"
            className="text-sm font-medium text-ecopet-green underline-offset-2 hover:underline"
            onClick={() => setShowPicker((v) => !v)}
          >
            {showPicker ? t("maps.hideMap") : t("maps.showMap")}
          </button>
          {showPicker || (value.latitude != null && value.longitude != null) ? (
            <AddressMapPicker
              latitude={value.latitude}
              longitude={value.longitude}
              onConfirm={(coords, reverse) => {
                const next: AddressByCepValue = mergeAddress(value, {
                  latitude: coords.lat,
                  longitude: coords.lng,
                });
                if (reverse && window.confirm(t("maps.applyReverseConfirm"))) {
                  onChange(mergeAddress(next, structuredToAddressByCepFields(reverse)));
                } else {
                  onChange(next);
                }
              }}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
