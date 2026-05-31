"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  MapPin,
  Repeat2,
  ShoppingBag,
  Calendar,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Flag,
  Link2,
  VolumeX,
  Ban,
  Send,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SocialPost } from "@/lib/social/types";
import { PROFILE_TYPE_LABELS, POST_TYPE_LABELS, formatSocialTime, formatCount } from "@/lib/social/config";
import { useSocialStore } from "@/store/social-store";
import { PostComments } from "@/components/social/post-comments";
import { cn } from "@/lib/utils";

interface FeedPostCardProps {
  post: SocialPost;
  showCommentsDefault?: boolean;
}

export function FeedPostCard({ post, showCommentsDefault = false }: FeedPostCardProps) {
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const toggleLike = useSocialStore((s) => s.toggleLike);
  const toggleSave = useSocialStore((s) => s.toggleSave);
  const toggleFollow = useSocialStore((s) => s.toggleFollow);
  const isLiked = useSocialStore((s) => s.isLiked(post.id));
  const isSaved = useSocialStore((s) => s.isSaved(post.id));
  const isFollowing = useSocialStore((s) => s.isFollowing(post.author.id));
  const getLikeCount = useSocialStore((s) => s.getLikeCount);
  const expandedCommentsPostId = useSocialStore((s) => s.expandedCommentsPostId);
  const setExpandedComments = useSocialStore((s) => s.setExpandedComments);
  const votePoll = useSocialStore((s) => s.votePoll);
  const pollVotes = useSocialStore((s) => s.pollVotes);

  const commentsOpen = showCommentsDefault || expandedCommentsPostId === post.id;
  const votedOption = pollVotes[post.id];

  return (
    <Card className="mb-4 overflow-hidden border-ecopet-gray/10 shadow-sm transition hover:shadow-md">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center gap-3 p-4">
          <Link href={`/social/perfil/${post.author.id}`} className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-ecopet-green/20">
            <Image src={post.author.avatar} alt="" fill className="object-cover" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <Link href={`/social/perfil/${post.author.id}`} className="font-semibold text-ecopet-dark hover:underline dark:text-white">
                {post.author.name}
              </Link>
              {post.author.isVerified && <Badge variant="verified">✓</Badge>}
              <Badge variant="default" className="text-[10px]">
                {PROFILE_TYPE_LABELS[post.author.type]}
              </Badge>
              {post.isSponsored && (
                <Badge className="bg-ecopet-yellow/20 text-[10px] text-ecopet-dark">Patrocinado</Badge>
              )}
              {POST_TYPE_LABELS[post.type] && (
                <Badge variant="vet" className="text-[10px]">{POST_TYPE_LABELS[post.type]}</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-ecopet-gray">
              {post.pet && <span>com {post.pet.name}</span>}
              {post.location && (
                <span className="flex items-center gap-0.5">
                  <MapPin className="h-3 w-3" /> {post.location}
                </span>
              )}
              <span>· {formatSocialTime(post.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!isFollowing && post.author.id !== "p1" && (
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => toggleFollow(post.author.id)}>
                Seguir
              </Button>
            )}
            <div className="relative">
              <button
                type="button"
                className="rounded-lg p-2 hover:bg-ecopet-gray/10"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Mais ações"
              >
                <MoreHorizontal className="h-5 w-5 text-ecopet-gray" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-ecopet-gray/10 bg-white py-1 shadow-lg dark:bg-[#1a1f26]">
                  {[
                    { icon: Repeat2, label: "Repostar" },
                    { icon: Link2, label: "Copiar link" },
                    { icon: Send, label: "Enviar no chat" },
                    { icon: VolumeX, label: "Silenciar" },
                    { icon: Ban, label: "Bloquear" },
                    { icon: Flag, label: "Denunciar" },
                  ].map(({ icon: Icon, label }) => (
                    <button
                      key={label}
                      type="button"
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-ecopet-green/5"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Icon className="h-4 w-4" /> {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Media */}
        {post.media.length > 0 && (
          <div className="relative">
            {post.type === "carousel" && post.media.length > 1 ? (
              <>
                <div className="relative aspect-square">
                  <Image src={post.media[carouselIndex].url} alt="" fill className="object-cover" />
                </div>
                <button
                  type="button"
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1 text-white"
                  onClick={() => setCarouselIndex((i) => Math.max(0, i - 1))}
                  disabled={carouselIndex === 0}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1 text-white"
                  onClick={() => setCarouselIndex((i) => Math.min(post.media.length - 1, i + 1))}
                  disabled={carouselIndex === post.media.length - 1}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
                  {post.media.map((_, i) => (
                    <div key={i} className={cn("h-1.5 w-1.5 rounded-full", i === carouselIndex ? "bg-white" : "bg-white/50")} />
                  ))}
                </div>
              </>
            ) : (
              <Link href={`/social/post/${post.id}`} className="relative block aspect-square">
                <Image src={post.media[0].url} alt="" fill className="object-cover" />
                {post.type === "reel" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold">▶ Reel</div>
                  </div>
                )}
              </Link>
            )}
          </div>
        )}

        {/* Poll */}
        {post.poll && (
          <div className="space-y-2 px-4 py-3">
            <p className="text-sm font-semibold">{post.poll.question}</p>
            {post.poll.options.map((opt) => {
              const total = post.poll!.options.reduce((s, o) => s + o.votes, 0);
              const pct = total ? Math.round((opt.votes / total) * 100) : 0;
              const selected = votedOption === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={Boolean(votedOption)}
                  onClick={() => votePoll(post.id, opt.id)}
                  className={cn(
                    "relative w-full overflow-hidden rounded-xl border px-4 py-2.5 text-left text-sm transition",
                    selected ? "border-ecopet-green bg-ecopet-green/10" : "border-ecopet-gray/15 hover:border-ecopet-green/40"
                  )}
                >
                  {votedOption && (
                    <div className="absolute inset-y-0 left-0 bg-ecopet-green/15" style={{ width: `${pct}%` }} />
                  )}
                  <span className="relative flex justify-between">
                    {opt.label}
                    {votedOption && <span className="text-xs text-ecopet-gray">{pct}%</span>}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Marketplace / Service / Adoption embeds */}
        {post.marketplace && (
          <div className="mx-4 mb-3 flex items-center gap-3 rounded-xl border border-ecopet-green/20 bg-ecopet-green/5 p-3">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
              <Image src={post.marketplace.image} alt="" fill className="object-cover" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{post.marketplace.name}</p>
              <p className="text-ecopet-green font-bold">R$ {post.marketplace.price.toFixed(2)}</p>
            </div>
            <Button size="sm" asChild>
              <Link href="/marketplace"><ShoppingBag className="h-4 w-4" /> Comprar</Link>
            </Button>
          </div>
        )}
        {post.service && (
          <div className="mx-4 mb-3 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
            <div className="flex-1">
              <p className="text-sm font-semibold">{post.service.name}</p>
              <p className="font-bold text-amber-700 dark:text-amber-400">R$ {post.service.price.toFixed(2)}</p>
            </div>
            <Button size="sm" variant="secondary" asChild>
              <Link href="/marketplace">
                <Calendar className="h-4 w-4" />
                {post.service.cta === "agendar" ? "Agendar" : "Contratar"}
              </Link>
            </Button>
          </div>
        )}
        {post.adoption && (
          <div className="mx-4 mb-3 flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
              <Image src={post.adoption.image} alt="" fill className="object-cover" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{post.adoption.petName} — {post.adoption.species}</p>
              <p className="text-xs text-rose-600">Procura lar ❤️</p>
            </div>
            <Button size="sm" asChild>
              <Link href="/adocao">Adotar</Link>
            </Button>
          </div>
        )}

        {post.aiInsight && (
          <div className="mx-4 mb-3 flex items-start gap-2 rounded-xl bg-violet-500/10 px-3 py-2 text-xs text-violet-800 dark:text-violet-300">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
            {post.aiInsight}
          </div>
        )}

        {/* Caption */}
        <div className="px-4 pb-2">
          <p className="text-sm">
            <Link href={`/social/perfil/${post.author.id}`} className="mr-1 font-semibold hover:underline">
              {post.author.username}
            </Link>
            {post.caption}
          </p>
          {post.hashtags.length > 0 && (
            <p className="mt-1 text-sm text-ecopet-green">
              {post.hashtags.map((h) => `#${h}`).join(" ")}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 border-t px-2 py-2">
          <button
            type="button"
            className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm transition", isLiked ? "text-rose-500" : "hover:bg-ecopet-gray/5")}
            onClick={() => toggleLike(post.id)}
          >
            <Heart className={cn("h-5 w-5", isLiked && "fill-current")} />
            {formatCount(getLikeCount(post))}
          </button>
          <button
            type="button"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm hover:bg-ecopet-gray/5"
            onClick={() => setExpandedComments(commentsOpen ? null : post.id)}
          >
            <MessageCircle className="h-5 w-5" />
            {post.commentsCount}
          </button>
          <button
            type="button"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm hover:bg-ecopet-gray/5"
            onClick={() => setShareOpen(!shareOpen)}
          >
            <Share2 className="h-5 w-5" />
            {formatCount(post.shares)}
          </button>
          <button
            type="button"
            className={cn("rounded-lg p-2 transition", isSaved ? "text-ecopet-yellow" : "hover:bg-ecopet-gray/5")}
            onClick={() => toggleSave(post.id)}
            aria-label="Salvar"
          >
            <Bookmark className={cn("h-5 w-5", isSaved && "fill-current")} />
          </button>
        </div>

        {shareOpen && (
          <div className="flex gap-2 border-t px-4 py-3">
            {["WhatsApp", "Instagram", "Copiar link", "Chat ECOPET"].map((l) => (
              <button key={l} type="button" className="rounded-full bg-ecopet-gray/10 px-3 py-1 text-xs font-medium hover:bg-ecopet-green/10">
                {l}
              </button>
            ))}
          </div>
        )}

        {commentsOpen && <PostComments postId={post.id} />}
      </CardContent>
    </Card>
  );
}
