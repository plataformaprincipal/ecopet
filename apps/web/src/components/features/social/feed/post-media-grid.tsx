import Image from "next/image";

type Media = { fileUrl: string; mimeType: string; mediaType: string; fileName: string };

export function PostMediaGrid({ media }: { media: Media[] }) {
  if (!media.length) return null;
  return (
    <div className={`grid gap-1 px-4 pb-3 ${media.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
      {media.map((m) => (
        <div key={m.fileUrl} className="relative aspect-square overflow-hidden rounded-lg bg-muted">
          {m.mediaType === "IMAGE" ? (
            <Image src={m.fileUrl} alt={m.fileName} fill className="object-cover" unoptimized />
          ) : (
            <a href={m.fileUrl} target="_blank" rel="noreferrer" className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {m.mediaType === "VIDEO" ? "Vídeo" : "Documento"}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
