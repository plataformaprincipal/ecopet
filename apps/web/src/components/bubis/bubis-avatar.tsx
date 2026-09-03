import { cn } from "@/lib/utils";

type BubisState = "normal" | "typing" | "alert";

export function BubisAvatar({
  state = "normal",
  size = 48,
  className,
}: {
  state?: BubisState;
  size?: number;
  className?: string;
}) {
  return (
    <span className={cn("relative inline-flex shrink-0", className)} style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/avatars/bubis.svg" alt="" width={size} height={size} className="rounded-2xl" />
      {state === "typing" ? (
        <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-ecopet-green" aria-hidden />
      ) : null}
      {state === "alert" ? (
        <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-red-500" aria-hidden />
      ) : null}
    </span>
  );
}
