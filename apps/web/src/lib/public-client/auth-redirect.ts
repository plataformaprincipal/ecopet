export function profilePathForRole(role: string): string {
  switch (role) {
    case "PARTNER":
      return "/parceiro/perfil-gestao";
    case "ONG":
      return "/ong/perfil-gestao";
    case "ADMIN":
      return "/dashboard/admin";
    case "CLIENT":
    default:
      return "/cliente/perfil";
  }
}

export function meuPetPathForRole(role: string): string {
  if (role === "CLIENT") return "/cliente/meu-pet";
  return profilePathForRole(role);
}
