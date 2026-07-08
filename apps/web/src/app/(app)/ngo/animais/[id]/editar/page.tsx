import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function NgoAnimaisEditarPage({ params }: Props) {
  const { id } = await params;
  redirect(`/ngo/animals/${id}/edit`);
}
