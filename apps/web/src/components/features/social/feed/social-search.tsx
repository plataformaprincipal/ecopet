"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchSocial } from "@/lib/social/client-api";

export function SocialSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ posts: { id: string; content: string }[]; hashtags: { slug: string; name: string }[]; profiles: { userId: string; displayName: string }[] } | null>(null);
  const [loading, setLoading] = useState(false);

  async function search() {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const data = await searchSocial(q);
      setResults(data as typeof results);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar posts, hashtags, perfis..." onKeyDown={(e) => e.key === "Enter" && search()} />
        <Button onClick={search} disabled={loading}>
          <Search className="h-4 w-4" />
        </Button>
      </div>
      {results && (
        <div className="space-y-4">
          {results.hashtags.length > 0 && (
            <section>
              <h3 className="font-semibold">Hashtags</h3>
              <ul className="mt-2 space-y-1">
                {results.hashtags.map((h) => (
                  <li key={h.slug}>
                    <Link href={`/feed/hashtag/${h.slug}`} className="text-ecopet-primary hover:underline">
                      #{h.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {results.profiles.length > 0 && (
            <section>
              <h3 className="font-semibold">Perfis</h3>
              <ul className="mt-2 space-y-1">
                {results.profiles.map((p) => (
                  <li key={p.userId}>
                    <Link href={`/feed/profile/${p.userId}`} className="hover:underline">
                      {p.displayName}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {results.posts.length > 0 && (
            <section>
              <h3 className="font-semibold">Posts</h3>
              <ul className="mt-2 space-y-2">
                {results.posts.map((p) => (
                  <li key={p.id}>
                    <Link href={`/feed/post/${p.id}`} className="text-sm hover:underline">
                      {p.content?.slice(0, 120)}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {!results.posts.length && !results.hashtags.length && !results.profiles.length && (
            <p className="text-sm text-muted-foreground">Nenhum resultado.</p>
          )}
        </div>
      )}
    </div>
  );
}
