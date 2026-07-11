"use client";

type Props = {
  content: string;
  streaming?: boolean;
};

export function AIStreamingMessage({ content, streaming }: Props) {
  return (
    <div className="whitespace-pre-wrap break-words">
      {content}
      {streaming && <span className="ml-0.5 inline-block h-4 w-1 animate-pulse bg-current align-middle" aria-hidden />}
    </div>
  );
}
