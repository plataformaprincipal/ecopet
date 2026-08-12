import { cn } from "@/lib/utils";
import { BrandMark } from "./brand-mark";

export interface InstitutionalLoaderProps {
  className?: string;
  /** dark = fundo institucional verde; light = fundo branco */
  surface?: "dark" | "light";
  fullScreen?: boolean;
  label?: string;
}

/**
 * Loading institucional EcoPet — símbolo + animação discreta, sem texto cru.
 */
export function InstitutionalLoader({
  className,
  surface = "dark",
  fullScreen = true,
  label = "EccoPet",
}: InstitutionalLoaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-5",
        fullScreen && "min-h-screen w-full",
        surface === "dark" ? "bg-ecopet-dark" : "bg-white dark:bg-ecopet-dark-bg",
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="animate-ecopet-pulse rounded-2xl bg-ecopet-dark p-1 shadow-lg">
        <BrandMark size={72} tone="on-dark" />
      </div>
      <span className="sr-only">{label}</span>
      <div
        className={cn(
          "h-1 w-24 overflow-hidden rounded-full",
          surface === "dark" ? "bg-white/15" : "bg-ecopet-green/15"
        )}
        aria-hidden
      >
        <div
          className={cn(
            "h-full w-1/2 rounded-full",
            surface === "dark" ? "bg-white" : "bg-ecopet-green",
            "animate-[ep-shimmer_1.2s_linear_infinite]"
          )}
          style={{
            backgroundImage:
              surface === "dark"
                ? "linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)"
                : undefined,
            backgroundSize: "200% 100%",
          }}
        />
      </div>
    </div>
  );
}
