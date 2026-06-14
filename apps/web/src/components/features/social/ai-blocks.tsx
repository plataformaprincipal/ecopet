"use client";

import type { AiSuggestion } from "@/lib/social/types";

interface AiSuggestionsBlockProps {
  suggestions?: AiSuggestion[];
}

export function AiSuggestionsBlock({ suggestions = [] }: AiSuggestionsBlockProps) {
  if (suggestions.length === 0) return null;
  return null;
}

interface AiCommunityBlockProps {
  insights?: { id: string; text: string }[];
}

export function AiCommunityBlock({ insights = [] }: AiCommunityBlockProps) {
  if (insights.length === 0) return null;
  return null;
}
