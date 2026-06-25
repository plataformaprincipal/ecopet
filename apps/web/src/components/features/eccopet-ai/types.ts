export type AIRecommendation = {
  label: string;
  href: string;
};

export type AIMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  recommendations?: AIRecommendation[];
  pending?: boolean;
};

export type AIConversation = {
  id: string;
  title: string;
  messages: AIMessage[];
  createdAt: number;
};
