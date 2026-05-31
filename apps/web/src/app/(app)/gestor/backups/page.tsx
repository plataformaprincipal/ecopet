import { GestorPageHeader } from "@/components/gestor/gestor-shell";
import { BackupCenterPanel } from "@/components/platform/gestor-centers";

export default function GestorBackupsPage() {
  return (
    <>
      <GestorPageHeader title="Backup Center" description="Backup automático, manual, snapshots e recuperação" />
      <BackupCenterPanel />
    </>
  );
}
