"use client";

/**
 * Campos de endereço do Petshop Web — integração com busca automática de CEP.
 * Complemento e ponto de referência são opcionais (único optativo no endereço).
 */
import { useState } from "react";
import { AddressByCepField } from "@/components/shared/address/address-by-cep-field";
import { EMPTY_ADDRESS } from "@/lib/address/types";

function Required() {
  return <span className="required"> *</span>;
}

export function PetshopClientAddressFields() {
  const [address, setAddress] = useState({ ...EMPTY_ADDRESS });

  return (
    <>
      <AddressByCepField
        value={address}
        onChange={setAddress}
        variant="bootstrap"
        idPrefix="petshop-client"
        title="Endereço do tutor"
        showReference
      />
      {/* Campos ocultos para envio do formulário HTML */}
      <input type="hidden" name="cep" value={address.zipCode} data-address-required />
      <input
        type="hidden"
        name="endereco"
        value={[address.street, address.number, address.district].filter(Boolean).join(", ")}
        data-address-required
      />
      <input type="hidden" name="cidade" value={address.city} data-address-required />
      <input type="hidden" name="estado" value={address.state} data-address-required />
    </>
  );
}

export function PetshopDeliveryAddressFields() {
  const [address, setAddress] = useState({ ...EMPTY_ADDRESS });

  return (
    <>
      <AddressByCepField
        value={address}
        onChange={setAddress}
        variant="bootstrap"
        idPrefix="petshop-delivery"
        title="Endereço para entrega/busca do pet"
        showReference
      />
      <input type="hidden" name="cepEntrega" value={address.zipCode} data-entrega-required />
      <input
        type="hidden"
        name="enderecoEntrega"
        value={[address.street, address.number, address.district, address.complement]
          .filter(Boolean)
          .join(", ")}
        data-entrega-required
      />
      <input type="hidden" name="cidadeEntrega" value={address.city} data-entrega-required />
    </>
  );
}

export { Required };
