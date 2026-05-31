import { GestorPageHeader } from "@/components/gestor/gestor-shell";
import { DataLayerPanel } from "@/components/platform/gestor-centers";

export default function GestorDataLayerPage() {
  return (
    <>
      <GestorPageHeader title="Data Layer" description="Data Lake, Warehouse, Mart, ETL e Analytics" />
      <DataLayerPanel />
    </>
  );
}
