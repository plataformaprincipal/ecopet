import { GestorPageHeader } from "@/components/features/gestor/gestor-shell";
import { DataLayerPanel } from "@/components/features/platform/gestor-centers";

export default function GestorDataLayerPage() {
  return (
    <>
      <GestorPageHeader title="Data Layer" description="Data Lake, Warehouse, Mart, ETL e Analytics" />
      <DataLayerPanel />
    </>
  );
}
