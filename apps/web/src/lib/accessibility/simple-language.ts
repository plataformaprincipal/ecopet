/**
 * Linguagem simples — dicionário estático (sem IA em runtime).
 * Ativado com html.a11y-cognitive (modo cognitivo / linguagem simples).
 */
export const SIMPLE_LANGUAGE_MAP: Record<string, string> = {
  // Acessibilidade
  "Acessibilidade": "Ajustes para facilitar o uso",
  "Acessibilidade EccoPet": "Ajustes para facilitar o uso do EccoPet",
  "Personalização": "Mudar aparência",
  "Preferências": "Suas escolhas",
  "Visual": "Ver melhor",
  "Auditiva": "Ouvir e avisos",
  "Cognitiva": "Textos mais fáceis",
  "Motora": "Clicar com mais facilidade",
  "Neurodivergência": "Menos distrações",
  "Libras": "Língua de sinais",
  "Braille / Leitor de Tela": "Leitura em Braille ou voz",
  "Idiomas": "Idioma",
  "Modo linguagem simples": "Usar textos mais fáceis",
  "Interface simplificada": "Tela mais simples",

  // Cadastro / conta
  "Criar conta": "Fazer um cadastro",
  "Entrar": "Acessar sua conta",
  "Cadastro": "Criar sua conta",
  "Registrar": "Criar sua conta",
  "Fazer login": "Entrar na sua conta",
  "Perfil": "Seus dados",
  "Minha conta": "Sua conta",

  // Social
  "Participe da comunidade": "Entre na comunidade EccoPet",
  "Tornar publicação privada": "Só você poderá ver esta publicação",
  "Tornar privada": "Só você poderá ver",
  "Tornar pública": "Todos podem ver",
  "Somente seguidores": "Só quem te segue pode ver",
  "Publicação agora é pública.": "Agora todos podem ver.",
  "Visível apenas para seguidores.": "Só quem te segue pode ver.",
  "Só você poderá ver esta publicação.": "Só você pode ver esta publicação.",
  "Publicação agora é privada.": "Só você pode ver.",
  "Denunciar publicação": "Avisar sobre um problema nesta publicação",
  "Excluir publicação": "Apagar esta publicação",
  "Editar publicação": "Mudar o texto da publicação",
  "Salvar": "Guardar",
  "Compartilhar": "Enviar para outras pessoas",
  "FOLLOWERS": "Somente seguidores",
  "FOLLOWERS_ONLY": "Somente seguidores",
  "PUBLIC": "Pública",
  "PRIVATE": "Privada",

  // Marketplace
  "Marketplace": "Loja de produtos e serviços",
  "Mais perto de mim": "Opções próximas de você",
  "Perto de mim": "Opções próximas de você",
  "Frete grátis": "Sem custo de entrega",
  "Verificados": "Parceiros confiáveis",
  "Promoções": "Ofertas",
  "Produtos": "Itens para comprar",
  "Serviços": "Cuidados e atendimento",
  "Parceiros": "Lojas e profissionais",
  "Ordenando por proximidade (raio ~50 km quando houver coordenadas do parceiro).":
    "Mostrando opções perto de você (até cerca de 50 km).",
  "Usamos sua localização só para ordenar parceiros e produtos próximos. Não armazenamos coordenadas permanentes neste fluxo.":
    "Usamos sua localização só para mostrar o que está perto. Não guardamos esse dado neste fluxo.",
  "Não foi possível ordenar por proximidade agora.": "Não deu para ordenar pelo que está perto agora.",
  "Solicitando permissão de localização…": "Pedindo permissão para usar sua localização…",
  "Localização negada no navegador. Você pode liberar a permissão e tentar novamente.":
    "A localização está bloqueada. Você pode liberar e tentar de novo.",

  // Meu pet
  "Caderneta de Vacinas": "Vacinas do seu pet",
  "Vacinas tomadas": "Vacinas já aplicadas",
  "Em dia": "Em dia",
  "Próxima": "Quase na data",
  "Atrasada": "Passou da data",
  "Sem data": "Sem data marcada",
  "Sem informação": "Ainda sem essa informação",
  "Gerencie suas preferências e configurações da conta.": "Escolha como sua conta deve funcionar.",
  "Cadastre, edite e acompanhe os pets vinculados à sua conta.": "Veja e atualize os dados do seu pet.",
  "Identidade persistente do seu animal — cadastro, caderneta e lembretes.": "Aqui ficam os dados, vacinas e avisos do seu pet.",
  "Fale diretamente com nossa equipe.": "Fale com a equipe EccoPet.",
  "EccoPontos": "Seus pontos EccoPet",
  "Meus pedidos": "Compras que você fez",
  "Minha agenda": "Seus horários",
  "Mensagens": "Conversas",
  "Recompensas": "Prêmios com pontos",
  "Suporte EccoPet": "Ajuda da equipe EccoPet",
  "Nenhuma vacina registrada ainda.": "Ainda não há vacinas cadastradas.",
  "Meu Pet": "Seu animal de estimação",

  // Adoção
  "Adote com responsabilidade": "Adotar um pet com cuidado",
  "Filtros": "Escolher opções",
  "Busca": "Procurar",
  "Espécie": "Tipo de animal",
  "Sexo": "Macho ou fêmea",
  "Porte": "Tamanho",
  "Idade": "Idade",
  "Cidade": "Cidade",
  "Vacinado": "Com vacina",
  "Castrado": "Castrado",
  "Necessidades especiais": "Cuidados especiais",
  "Aplicar filtros": "Usar estas opções",
  "Limpar": "Apagar opções",
  "Limpar filtros": "Apagar opções",
  "Todas": "Todas",
  "Todos": "Todos",
  "Cachorro": "Cachorro",
  "Gato": "Gato",
  "Filhote": "Filhote",
  "Jovem": "Jovem",
  "Adulto": "Adulto",
  "Idoso": "Idoso",

  // Suporte
  "Suporte": "Ajuda",
  "Meu Suporte": "Minha ajuda",
  "Novo chamado": "Pedir ajuda",
  "Abrir suporte": "Falar com a ajuda",
  "Gerenciar preferências de notificações": "Escolha quais avisos você quer receber",
};

export function simplifyText(text: string, enabled: boolean): string {
  if (!enabled || !text) return text;
  return SIMPLE_LANGUAGE_MAP[text] ?? text;
}
