"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AppHeader } from "@/components/layouts/app-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface Listing {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  photos: string[];
  description: string;
}

export default function AdocaoPage() {
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    api<Listing[]>("/api/adoption").then(setListings).catch(() => setListings([]));
  }, []);

  return (
    <>
      <AppHeader title="Adoção" />
      <main className="flex-1 p-4 lg:p-8">
        <p className="mb-6 text-ecopet-gray">Encontre seu novo melhor amigo. ONGs parceiras ECOPET.</p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="p-8 text-center">
                <p>Conecte o PostgreSQL e execute npm run db:seed</p>
              </CardContent>
            </Card>
          ) : (
            listings.map((l) => (
              <Card key={l.id}>
                <div className="relative aspect-video">
                  {l.photos[0] && <Image src={l.photos[0]} alt={l.name} fill className="object-cover rounded-t-2xl" />}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-lg">{l.name}</h3>
                  <p className="text-sm text-ecopet-gray">{l.breed || "SRD"} · {l.species}</p>
                  <p className="mt-2 text-sm line-clamp-2">{l.description}</p>
                  <Button className="mt-4 w-full">Quero adotar</Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </>
  );
}
