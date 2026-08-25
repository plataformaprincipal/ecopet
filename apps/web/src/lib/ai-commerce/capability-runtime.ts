import { AI_COMMERCE_PRODUCTS, getProductDefBySku, type AiWorkspaceKind } from "./catalog";
import type { AiCommerceSku } from "./flags";
import { getSpecialistProtocol } from "./specialist-protocols";

export type WizardFieldType = "text" | "textarea" | "chips" | "checkboxes" | "abc";

export type WizardField = {
  id: string;
  label: string;
  type: WizardFieldType;
  options?: string[];
  required?: boolean;
  showIf?: { field: string; equals?: string; truthy?: boolean };
  skipIfPetHas?: string;
};

export type WizardStep = {
  id: string;
  title: string;
  description?: string;
  fields: WizardField[];
  upload?: {
    kind: "vision" | "lab";
    accept: string;
    multiple?: boolean;
    slots?: string[];
    label: string;
  };
};

export type CapabilityRuntime = {
  sku: AiCommerceSku;
  capabilityId: string;
  kind: AiWorkspaceKind;
  name: string;
  headline: string;
  description: string;
  youProvide: string[];
  youReceive: string[];
  fileTypes: string[];
  petDataUsed: string[];
  quickActions: string[];
  steps: WizardStep[];
  supportsImageInput: boolean;
  supportsFileInput: boolean;
  supportsPdf: boolean;
  supportsImageOutput: boolean;
  supportsSpreadsheet: boolean;
  followUpPrompt: string;
  followUpSuggestions: string[];
  chatTitle: string;
  specialistTitle?: string;
  ctaLabel?: string;
  intro?: string;
};

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
const DOC_ACCEPT = "application/pdf,image/jpeg,image/png,image/webp";

const RUNTIMES: Record<string, Omit<CapabilityRuntime, "sku" | "capabilityId" | "kind" | "name">> = {
  AI_ECCOVET: {
    headline: "Entenda o que pode estar acontecendo com seu pet",
    description:
      "Conte os sinais, adicione fotos ou documentos e receba uma análise clínica estruturada para decidir o próximo passo.",
    youProvide: ["Motivo principal e sinais", "Quando começou e como evoluiu", "Fotos ou documentos opcionais"],
    youReceive: ["Resumo clínico", "Impressão Diagnóstica Assistida", "Evidências, diferenciais e próximos passos"],
    fileTypes: ["JPEG", "PNG", "WEBP", "PDF"],
    petDataUsed: ["Identidade", "Peso", "Alergias", "Medicações", "Vacinas", "Histórico recente"],
    quickActions: ["Avaliar sintomas", "Analisar alteração recente", "Preparar consulta", "Revisar histórico", "Entender documento"],
    supportsImageInput: true,
    supportsFileInput: true,
    supportsPdf: true,
    supportsImageOutput: false,
    supportsSpreadsheet: true,
    followUpPrompt: "Pergunte ao EccoVet sobre esta análise",
    chatTitle: "Converse com o especialista",
    followUpSuggestions: [
      "Explique esta conclusão.",
      "Por que esta hipótese apareceu?",
      "O que devo observar?",
      "Que perguntas devo fazer ao veterinário?",
      "Resuma isso.",
    ],
    steps: [
      {
        id: "motivo",
        title: "O que está acontecendo?",
        description: "Comece pelo motivo principal. Depois aprofundamos só o necessário.",
        fields: [
          { id: "complaint", label: "Motivo principal", type: "textarea", required: true },
          {
            id: "quickAction",
            label: "Ação rápida",
            type: "chips",
            options: ["Avaliar sintomas", "Analisar alteração recente", "Preparar consulta", "Revisar histórico", "Entender documento"],
          },
        ],
      },
      {
        id: "sinais",
        title: "Sinais e evolução",
        fields: [
          { id: "onset", label: "Quando começou", type: "text", required: true },
          { id: "frequency", label: "Frequência", type: "chips", options: ["Única vez", "Intermitente", "Diário", "Contínuo", "Não sei"] },
          { id: "progress", label: "Progressão", type: "chips", options: ["Melhorou", "Estável", "Piorou", "Oscila", "Não sei"] },
          {
            id: "signs",
            label: "Sinais percebidos",
            type: "checkboxes",
            options: ["Vômito", "Diarreia", "Tosse", "Coceira", "Dor aparente", "Apatia", "Falta de apetite", "Sede aumentada", "Outro"],
          },
        ],
      },
      {
        id: "rotina",
        title: "Rotina e contexto",
        fields: [
          { id: "appetite", label: "Alimentação", type: "chips", options: ["Normal", "Reduzida", "Aumentada", "Não sei"] },
          { id: "water", label: "Água", type: "chips", options: ["Normal", "Reduzida", "Aumentada", "Não sei"] },
          { id: "urine", label: "Urina", type: "chips", options: ["Normal", "Alterada", "Não urina", "Não sei"] },
          { id: "stool", label: "Fezes", type: "chips", options: ["Normal", "Diarreia", "Prisão", "Sangue visível", "Não sei"] },
          { id: "activity", label: "Energia", type: "chips", options: ["Normal", "Baixa", "Agitada", "Não sei"] },
          { id: "pain", label: "Dor percebida", type: "chips", options: ["Não", "Leve", "Moderada", "Intensa", "Não sei"] },
          { id: "meds", label: "Medicações atuais", type: "text", skipIfPetHas: "medications" },
          { id: "exposure", label: "Mudanças ou exposição recente", type: "textarea" },
        ],
        upload: { kind: "lab", accept: DOC_ACCEPT, multiple: true, label: "Fotos ou documentos (opcional)" },
      },
    ],
  },
  AI_ECCOVET_TRIAGE: {
    headline: "O que está acontecendo agora?",
    description: "Protocolo guiado de triagem. A prioridade é a urgência, não um diagnóstico.",
    youProvide: ["Categoria do evento", "Sinais imediatos", "Tempo e progressão"],
    youReceive: ["Classificação de urgência", "O que fazer agora", "O que evitar", "Resumo para levar"],
    fileTypes: ["JPEG", "PNG", "WEBP"],
    petDataUsed: ["Nome", "Espécie", "Idade", "Peso", "Alergias conhecidas"],
    quickActions: ["Respiração", "Trauma", "Intoxicação", "Neurológico", "Dor", "Digestivo", "Urinário", "Sangramento", "Outro"],
    supportsImageInput: true,
    supportsFileInput: false,
    supportsPdf: false,
    supportsImageOutput: false,
    supportsSpreadsheet: false,
    followUpPrompt: "Tenho uma dúvida sobre esta triagem",
    chatTitle: "Dúvida sobre esta triagem",
    followUpSuggestions: ["Por que esta urgência?", "O que fazer agora?", "O que evitar?", "O que levar ao atendimento?"],
    steps: [
      {
        id: "agora",
        title: "O que está acontecendo agora?",
        fields: [
          {
            id: "category",
            label: "Categoria",
            type: "chips",
            required: true,
            options: ["Respiração", "Trauma", "Intoxicação", "Neurológico", "Dor", "Digestivo", "Urinário", "Sangramento", "Outro"],
          },
          { id: "complaint", label: "Descreva em uma frase", type: "textarea", required: true },
        ],
      },
      {
        id: "sinais",
        title: "Sinais imediatos",
        description: "Marque só o que está acontecendo agora. Sinais graves não são minimizados.",
        fields: [
          {
            id: "redFlags",
            label: "Sinais",
            type: "checkboxes",
            options: [
              "Respiração difícil",
              "Não responde",
              "Não consegue ficar em pé",
              "Convulsão",
              "Sangramento intenso",
              "Trauma",
              "Ingestão suspeita",
              "Vômitos persistentes",
              "Diarreia grave",
              "Barriga distendida",
              "Dor intensa",
              "Não consegue urinar",
            ],
          },
          { id: "onset", label: "Há quanto tempo", type: "chips", options: ["Minutos", "Horas", "Hoje", "Mais de 1 dia"] },
          { id: "progress", label: "Progressão", type: "chips", options: ["Estável", "Piorando", "Melhorando"] },
          { id: "temperature", label: "Temperatura se conhecida", type: "text" },
          { id: "mucosas", label: "Mucosas se o tutor souber", type: "chips", options: ["Não sei", "Rosadas", "Pálidas", "Azuis/roxas", "Amareladas"] },
        ],
      },
    ],
  },
  AI_ECCOCHECKUP: {
    headline: "Checkup preventivo inteligente",
    description: "Analisa o pet como um todo. Só perguntamos o que ainda não está no histórico.",
    youProvide: ["Confirmação do que já está no perfil", "Pontos em aberto da rotina"],
    youReceive: ["Estado do acompanhamento", "Lacunas", "Checklist", "Plano preventivo"],
    fileTypes: [],
    petDataUsed: ["Identidade", "Peso", "Vacinas", "Medicações", "Nutrição", "Exames", "Comportamento"],
    quickActions: ["Consultas", "Vacinas", "Peso", "Nutrição", "Oral", "Comportamento", "Exames", "Medicações", "Rotina"],
    supportsImageInput: false,
    supportsFileInput: false,
    supportsPdf: false,
    supportsImageOutput: false,
    supportsSpreadsheet: true,
    followUpPrompt: "Converse sobre o checkup",
    chatTitle: "Converse sobre o checkup",
    followUpSuggestions: ["O que está faltando?", "Qual a prioridade?", "Como acompanhar isso?"],
    steps: [
      {
        id: "faltantes",
        title: "Complete só o que falta",
        description: "Campos já conhecidos do pet não são pedidos de novo.",
        fields: [
          { id: "feeding", label: "Alimentação atual", type: "textarea", skipIfPetHas: "nutrition" },
          { id: "activity", label: "Atividade e rotina", type: "textarea" },
          { id: "behavior", label: "Comportamento recente", type: "textarea", skipIfPetHas: "behavior" },
          { id: "teeth", label: "Saúde oral observada", type: "textarea", skipIfPetHas: "dental" },
          { id: "prevention", label: "Prevenção (antiparasitário, checkups)", type: "textarea" },
          { id: "notes", label: "O que mudou desde o último acompanhamento?", type: "textarea" },
        ],
      },
    ],
  },
  AI_PET_HEALTH_PROFILE: {
    headline: "Dossiê inteligente do pet",
    description: "Central unificada do histórico: o cérebro longitudinal da EccoPet AI.",
    youProvide: ["O que deve entrar neste resumo", "Documentos opcionais"],
    youReceive: ["Health Brief", "Linha do tempo", "Tendências e lacunas", "Dossiê PDF/XLSX"],
    fileTypes: ["JPEG", "PNG", "WEBP", "PDF"],
    petDataUsed: ["Todo o histórico disponível do pet"],
    quickActions: ["Visão geral", "Linha do tempo", "Health Brief"],
    supportsImageInput: true,
    supportsFileInput: true,
    supportsPdf: true,
    supportsImageOutput: false,
    supportsSpreadsheet: true,
    followUpPrompt: "Pergunte sobre o histórico do seu pet",
    chatTitle: "Pergunte sobre o histórico",
    followUpSuggestions: ["Resuma o histórico.", "Quais lacunas existem?", "O que mudou recentemente?"],
    steps: [
      {
        id: "objetivo",
        title: "Como organizar o dossiê",
        fields: [
          { id: "notes", label: "O que deve entrar neste resumo?", type: "textarea", required: true },
          {
            id: "focus",
            label: "Foco",
            type: "chips",
            options: ["Visão geral", "Preparar consulta", "Tendências", "Documentos"],
          },
        ],
        upload: { kind: "lab", accept: DOC_ACCEPT, multiple: true, label: "Documentos do histórico (opcional)" },
      },
    ],
  },
  AI_ECCOVET_REPORT: {
    headline: "Documento veterinário assistido",
    description: "Gera um relatório técnico a partir do histórico, arquivos e análises anteriores.",
    youProvide: ["Tipo de relatório", "Período", "Documentos e texto adicional"],
    youReceive: ["PDF profissional", "Linha do tempo", "Fontes", "Conclusão assistida"],
    fileTypes: ["JPEG", "PNG", "WEBP", "PDF"],
    petDataUsed: ["Identidade", "Eventos", "Exames", "Medicações", "Vacinas", "Análises IA"],
    quickActions: [
      "Resumo pré-consulta",
      "Resumo pós-consulta",
      "Histórico clínico",
      "Relatório de acompanhamento",
      "Segunda opinião",
      "Linha do tempo",
      "Relatório de sintomas",
      "Dossiê",
    ],
    supportsImageInput: true,
    supportsFileInput: true,
    supportsPdf: true,
    supportsImageOutput: false,
    supportsSpreadsheet: true,
    followUpPrompt: "Peça alterações ao relatório",
    chatTitle: "Peça alterações ao relatório",
    followUpSuggestions: ["Faça uma versão mais curta para levar à consulta.", "Destaque só o essencial.", "Separe fato de inferência."],
    steps: [
      {
        id: "modo",
        title: "Tipo de relatório",
        fields: [
          {
            id: "reportType",
            label: "Modo",
            type: "chips",
            required: true,
            options: [
              "Resumo pré-consulta",
              "Resumo pós-consulta",
              "Histórico clínico",
              "Relatório de acompanhamento",
              "Segunda opinião",
              "Linha do tempo",
              "Relatório de sintomas",
              "Dossiê",
            ],
          },
          { id: "period", label: "Período (opcional)", type: "text" },
          { id: "notes", label: "Texto adicional", type: "textarea" },
        ],
        upload: { kind: "lab", accept: DOC_ACCEPT, multiple: true, label: "Arquivos de apoio" },
      },
    ],
  },
  AI_ECCOVET_EXAMS: {
    headline: "Leitor inteligente de exames",
    description: "Extrai analitos, organiza tabela comparável e elabora impressão interpretativa assistida. Não inventa referência.",
    youProvide: ["PDF ou foto do exame", "Múltiplas páginas ou exames"],
    youReceive: ["Tabela interativa", "Alterações", "Evolução", "PDF e XLSX"],
    fileTypes: ["PDF", "JPEG", "PNG", "WEBP"],
    petDataUsed: ["Espécie", "Idade", "Exames anteriores comparáveis"],
    quickActions: ["Enviar exame", "Comparar com anteriores"],
    supportsImageInput: true,
    supportsFileInput: true,
    supportsPdf: true,
    supportsImageOutput: false,
    supportsSpreadsheet: true,
    followUpPrompt: "Pergunte sobre seus exames",
    chatTitle: "Pergunte sobre seus exames",
    followUpSuggestions: ["Explique esta alteração.", "Isso fecha um diagnóstico?", "O que perguntar ao veterinário?"],
    steps: [
      {
        id: "upload",
        title: "Envie o exame",
        description: "Prefira o PDF original. Se for foto, use boa luz e enquadramento nítido.",
        fields: [{ id: "notes", label: "Observações (opcional)", type: "textarea" }],
        upload: { kind: "lab", accept: DOC_ACCEPT, multiple: true, label: "PDF ou imagens do exame" },
      },
    ],
  },
  AI_ECCOVET_VISION: {
    headline: "Análise visual veterinária",
    description: "Motor visual multimodal. Primeiro avaliamos a qualidade da foto; depois o que está visível.",
    youProvide: ["Foto nítida da região", "Categoria da alteração"],
    youReceive: ["Quality gate", "O que foi observado", "Impressão visual assistida", "Próximos passos"],
    fileTypes: ["JPEG", "PNG", "WEBP"],
    petDataUsed: ["Identidade", "Histórico relevante da região"],
    quickActions: ["Pele", "Olhos", "Ouvido", "Boca", "Dentes", "Patas", "Ferida", "Fezes", "Urina visível", "Nódulo", "Outro"],
    supportsImageInput: true,
    supportsFileInput: false,
    supportsPdf: false,
    supportsImageOutput: false,
    supportsSpreadsheet: false,
    followUpPrompt: "Pergunte ao EccoVet Vision",
    chatTitle: "Pergunte ao EccoVet Vision",
    followUpSuggestions: ["O que a foto mostra?", "Por que esta hipótese?", "Preciso de outra foto?"],
    steps: [
      {
        id: "regiao",
        title: "O que fotografar",
        fields: [
          {
            id: "region",
            label: "Região",
            type: "chips",
            required: true,
            options: ["Pele", "Olhos", "Ouvido", "Boca", "Dentes", "Patas", "Ferida", "Fezes", "Urina visível", "Nódulo", "Outro"],
          },
          { id: "notes", label: "O que você observou?", type: "textarea" },
        ],
        upload: { kind: "vision", accept: IMAGE_ACCEPT, multiple: true, label: "Fotos (luz natural, sem flash, sem filtro)" },
      },
    ],
  },
  AI_ECCODENTAL: {
    headline: "Scanner educativo de saúde oral",
    description: "Wizard de fotografia oral. Frontal e laterais ajudam, mas não são obrigatórias para uso básico.",
    youProvide: ["Fotos da boca", "Halitose, sangramento, mastigação"],
    youReceive: ["Resumo oral", "Impressão oral assistida", "Cuidados preventivos", "Guia visual de escovação"],
    fileTypes: ["JPEG", "PNG", "WEBP"],
    petDataUsed: ["Idade", "Alimentação", "Histórico dental se existir"],
    quickActions: ["Frontal", "Lateral esquerda", "Lateral direita"],
    supportsImageInput: true,
    supportsFileInput: false,
    supportsPdf: false,
    supportsImageOutput: true,
    supportsSpreadsheet: false,
    followUpPrompt: "Converse com o EccoDental",
    chatTitle: "Converse com o EccoDental",
    followUpSuggestions: ["Como escovar com segurança?", "O que é tártaro aparente?", "Quando procurar o veterinário?"],
    steps: [
      {
        id: "sinais",
        title: "Sinais orais",
        fields: [
          { id: "halitose", label: "Halitose", type: "chips", options: ["Não", "Leve", "Intensa", "Não sei"] },
          { id: "bleeding", label: "Sangramento", type: "chips", options: ["Não", "Ao mastigar", "Espontâneo", "Não sei"] },
          { id: "chewing", label: "Mastigação", type: "chips", options: ["Normal", "Evita um lado", "Dificuldade", "Não sei"] },
          { id: "pain", label: "Dor aparente", type: "chips", options: ["Não", "Sim", "Não sei"] },
          { id: "saliva", label: "Salivação", type: "chips", options: ["Normal", "Aumentada", "Não sei"] },
          { id: "brushing", label: "Escovação", type: "chips", options: ["Não faz", "Às vezes", "Regular"] },
          { id: "notes", label: "Observações", type: "textarea" },
        ],
        upload: {
          kind: "vision",
          accept: IMAGE_ACCEPT,
          multiple: true,
          slots: ["frontal", "lateral esquerda", "lateral direita"],
          label: "Fotos orais — não force a boca do animal",
        },
      },
    ],
  },
  AI_ECCONUTRI: {
    headline: "Inteligência nutricional personalizada",
    description: "Organiza a rotina alimentar. Não inventa dieta terapêutica clínica.",
    youProvide: ["Alimentação atual", "Quantidade e petiscos", "Foto do rótulo (opcional)"],
    youReceive: ["Perfil alimentar", "Pontos a revisar", "Plano de transição", "Diário XLSX"],
    fileTypes: ["JPEG", "PNG", "WEBP"],
    petDataUsed: ["Espécie", "Idade", "Raça", "Peso", "Alergias", "Restrições"],
    quickActions: ["Avaliar rotina", "Analisar rótulo"],
    supportsImageInput: true,
    supportsFileInput: false,
    supportsPdf: false,
    supportsImageOutput: true,
    supportsSpreadsheet: true,
    followUpPrompt: "Converse com EccoNutri",
    chatTitle: "Converse com EccoNutri",
    followUpSuggestions: ["Como organizar as refeições?", "Isso é dieta terapêutica?", "O que perguntar ao veterinário?"],
    steps: [
      {
        id: "rotina",
        title: "Rotina atual",
        fields: [
          { id: "diet", label: "Alimentação / produto", type: "text", required: true },
          { id: "amount", label: "Quantidade", type: "text" },
          { id: "frequency", label: "Refeições", type: "chips", options: ["1x", "2x", "3x", "Livre", "Não sei"] },
          { id: "treats", label: "Petiscos", type: "text" },
          { id: "activity", label: "Atividade", type: "chips", options: ["Baixa", "Moderada", "Alta"] },
          { id: "goal", label: "Objetivo", type: "chips", options: ["Manter", "Emagrecer", "Ganhar peso", "Revisar rotina"] },
          { id: "bcs", label: "Condição corporal se conhecida", type: "text" },
          { id: "restrictions", label: "Restrições", type: "text", skipIfPetHas: "allergies" },
        ],
        upload: { kind: "vision", accept: IMAGE_ACCEPT, multiple: true, label: "Foto do rótulo / tabela / ingredientes (opcional)" },
      },
    ],
  },
  AI_ECCOPESO: {
    headline: "Acompanhamento inteligente de peso",
    description: "O gráfico vem primeiro. Cálculos de variação são determinísticos no servidor.",
    youProvide: ["Peso atual", "Atividade e objetivo"],
    youReceive: ["Tendência", "Variação 30d", "Plano de monitoramento", "PDF/XLSX/CSV"],
    fileTypes: ["JPEG", "PNG", "WEBP"],
    petDataUsed: ["Peso atual", "Histórico de peso", "Alimentação se existir"],
    quickActions: ["Registrar peso", "Ver tendência"],
    supportsImageInput: true,
    supportsFileInput: false,
    supportsPdf: false,
    supportsImageOutput: false,
    supportsSpreadsheet: true,
    followUpPrompt: "Converse sobre evolução de peso",
    chatTitle: "Converse sobre evolução de peso",
    followUpSuggestions: ["A variação é preocupante?", "Com que frequência pesar?", "Abrir EccoNutri?"],
    steps: [
      {
        id: "peso",
        title: "Registro de peso",
        fields: [
          { id: "weight", label: "Peso atual (kg)", type: "text", required: true },
          { id: "bcs", label: "BCS se conhecido", type: "chips", options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "Não sei"] },
          { id: "activity", label: "Atividade", type: "chips", options: ["Baixa", "Moderada", "Alta"] },
          { id: "goal", label: "Objetivo", type: "text" },
          { id: "notes", label: "Mudanças recentes", type: "textarea" },
        ],
        upload: { kind: "vision", accept: IMAGE_ACCEPT, multiple: true, label: "Foto corporal opcional — não afirma escore clínico" },
      },
    ],
  },
  AI_ECCOBEHAVIOR: {
    headline: "Analista comportamental inteligente",
    description: "Detecta padrões sem antropomorfizar. Use o registro ABC quando possível.",
    youProvide: ["Tipo e contexto", "Frequência", "Registro ABC"],
    youReceive: ["Padrões", "Gatilhos", "Plano de manejo", "Diário ABC XLSX"],
    fileTypes: ["JPEG", "PNG", "WEBP"],
    petDataUsed: ["Idade", "Ambiente se informado", "Histórico comportamental"],
    quickActions: ["Registro ABC", "Plano de enriquecimento"],
    supportsImageInput: true,
    supportsFileInput: false,
    supportsPdf: false,
    supportsImageOutput: true,
    supportsSpreadsheet: true,
    followUpPrompt: "Converse com EccoBehavior",
    chatTitle: "Converse com EccoBehavior",
    followUpSuggestions: ["Como aplicar o plano?", "O que é antropomorfizar?", "Quando procurar especialista?"],
    steps: [
      {
        id: "padrao",
        title: "O comportamento",
        fields: [
          {
            id: "category",
            label: "Tipo",
            type: "chips",
            required: true,
            options: ["Ansiedade", "Separação", "Medo", "Agressividade relatada", "Latidos", "Destruição", "Eliminação inadequada", "Socialização", "Filhote", "Adaptação", "Outro"],
          },
          { id: "frequency", label: "Frequência", type: "text" },
          { id: "duration", label: "Duração", type: "text" },
          { id: "trigger", label: "Gatilhos", type: "text" },
          { id: "environment", label: "Ambiente", type: "text" },
          { id: "people", label: "Pessoas", type: "text" },
          { id: "animals", label: "Outros animais", type: "text" },
        ],
      },
      {
        id: "abc",
        title: "Registro ABC",
        description: "Antecedente, comportamento e consequência — o mais simples possível.",
        fields: [{ id: "abc", label: "ABC", type: "abc" }],
      },
    ],
  },
  AI_ECCOVACCINE: {
    headline: "Carteira inteligente de vacinação",
    description: "Extrai dados do comprovante. Você confirma antes de salvar. A próxima dose vem de regra, não do modelo.",
    youProvide: ["Foto/PDF da carteira ou registro manual"],
    youReceive: ["Carteira", "Campos incompletos", "Próximas ações", "PDF/XLSX"],
    fileTypes: ["JPEG", "PNG", "WEBP", "PDF"],
    petDataUsed: ["Espécie", "Idade", "Vacinas já cadastradas"],
    quickActions: ["Foto da carteira", "Registro manual"],
    supportsImageInput: true,
    supportsFileInput: true,
    supportsPdf: true,
    supportsImageOutput: false,
    supportsSpreadsheet: true,
    followUpPrompt: "Pergunte sobre a carteira",
    chatTitle: "Pergunte sobre a carteira",
    followUpSuggestions: ["O que está incompleto?", "Posso calcular a próxima dose?", "Como adicionar lembrete?"],
    steps: [
      {
        id: "registro",
        title: "Registrar vacina",
        description: "Se enviar foto, confirme os dados extraídos antes de salvar.",
        fields: [
          { id: "name", label: "Vacina", type: "text" },
          { id: "date", label: "Data", type: "text" },
          { id: "manufacturer", label: "Fabricante", type: "text" },
          { id: "batch", label: "Lote", type: "text" },
          { id: "place", label: "Estabelecimento", type: "text" },
          { id: "professional", label: "Profissional", type: "text" },
        ],
        upload: { kind: "lab", accept: DOC_ACCEPT, multiple: true, label: "Foto ou PDF do comprovante" },
      },
    ],
  },
  AI_ECCOMED: {
    headline: "Organizador inteligente de medicamentos prescritos",
    description: "A IA não cria medicamento, dose, suspensão ou substituição. Ela organiza o que está documentado.",
    youProvide: ["Receita em foto/PDF ou preenchimento manual"],
    youReceive: ["Cronograma", "Horários", "Alertas de informação incompleta", "XLSX de administração"],
    fileTypes: ["JPEG", "PNG", "WEBP", "PDF"],
    petDataUsed: ["Medicações já cadastradas", "Peso", "Alergias"],
    quickActions: ["Foto da receita", "Registro manual"],
    supportsImageInput: true,
    supportsFileInput: true,
    supportsPdf: true,
    supportsImageOutput: false,
    supportsSpreadsheet: true,
    followUpPrompt: "Converse com EccoMed",
    chatTitle: "Converse com EccoMed",
    followUpSuggestions: ["Explique o que está escrito na receita.", "A IA pode mudar a dose?", "Como organizar os horários?"],
    steps: [
      {
        id: "receita",
        title: "Medicamento prescrito",
        description: "Revise tudo antes de salvar. Nada é criado pela IA.",
        fields: [
          { id: "name", label: "Medicamento", type: "text" },
          { id: "presentation", label: "Forma / concentração", type: "text" },
          { id: "dose", label: "Dose escrita", type: "text" },
          { id: "frequency", label: "Frequência escrita", type: "text" },
          { id: "time", label: "Horário", type: "text" },
          { id: "start", label: "Início", type: "text" },
          { id: "end", label: "Duração / fim", type: "text" },
          { id: "prescriber", label: "Prescritor", type: "text" },
        ],
        upload: { kind: "lab", accept: DOC_ACCEPT, multiple: true, label: "Foto ou PDF da receita" },
      },
    ],
  },
};

export function getCapabilityRuntime(sku: string): CapabilityRuntime | undefined {
  const def = getProductDefBySku(sku);
  const spec = RUNTIMES[def?.sku ?? sku];
  if (!def || !spec) return undefined;
  const protocol = getSpecialistProtocol(def.sku);
  return {
    ...spec,
    sku: def.sku,
    capabilityId: def.capabilityId,
    kind: def.workspaceKind,
    name: def.name,
    specialistTitle: protocol?.specialistTitle ?? spec.headline,
    ctaLabel: protocol?.ctaLabel ?? def.ctaLabel,
    intro: protocol?.intro,
    followUpPrompt: protocol?.followUpPrompt ?? spec.followUpPrompt,
    followUpSuggestions: protocol?.followUpSuggestions ?? spec.followUpSuggestions,
    chatTitle: protocol?.specialistTitle ?? spec.chatTitle,
  };
}

export function getCapabilityRuntimeByKind(kind: AiWorkspaceKind): CapabilityRuntime | undefined {
  const def = AI_COMMERCE_PRODUCTS.find((p) => p.workspaceKind === kind);
  return def ? getCapabilityRuntime(def.sku) : undefined;
}

export function listCapabilityRuntimes(): CapabilityRuntime[] {
  return AI_COMMERCE_PRODUCTS.map((p) => getCapabilityRuntime(p.sku)).filter((x): x is CapabilityRuntime => Boolean(x));
}

export function visibleWizardSteps(runtime: CapabilityRuntime, petContext: Record<string, unknown> | null): WizardStep[] {
  return runtime.steps.map((step) => ({
    ...step,
    fields: step.fields.filter((field) => {
      if (!field.skipIfPetHas || !petContext) return true;
      const value = petContext[field.skipIfPetHas];
      if (Array.isArray(value)) return value.length === 0;
      return value == null || value === "" || value === false;
    }),
  }));
}
