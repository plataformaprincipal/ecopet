import Link from "next/link";

export function HashtagLink({ slug, name }: { slug: string; name: string }) {
  return (
    <Link href={`/feed/hashtag/${slug}`} className="text-sm text-ecopet-primary hover:underline">
      #{name}
    </Link>
  );
}
