"use client";

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
        title=""
        showReference={false}
      />
      <input type="hidden" name="cep" value={address.zipCode} />
      <input type="hidden" name="endereco" value={[address.street, address.number, address.district].filter(Boolean).join(", ")} />
      <input type="hidden" name="cidade" value={address.city} />
      <input type="hidden" name="estado" value={address.state} />
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
        title="Endereço para entrega/busca"
      />
      <input type="hidden" name="cepEntrega" value={address.zipCode} data-entrega-required />
      <input type="hidden" name="enderecoEntrega" value={[address.street, address.number, address.district, address.complement].filter(Boolean).join(", ")} data-entrega-required />
      <input type="hidden" name="cidadeEntrega" value={address.city} data-entrega-required />
    </>
  );
}

export { Required };
