"use client";

import { useEffect, useRef } from "react";
import type { LatLng } from "@/lib/google-maps/types";

export function MapMarker({
  map,
  position,
  draggable = false,
  title,
  onDragEnd,
}: {
  map: google.maps.Map | null;
  position: LatLng;
  draggable?: boolean;
  title?: string;
  onDragEnd?: (pos: LatLng) => void;
}) {
  const markerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    if (!map || typeof google === "undefined") return;

    if (!markerRef.current) {
      markerRef.current = new google.maps.Marker({
        map,
        position,
        draggable,
        title,
      });
      if (draggable && onDragEnd) {
        markerRef.current.addListener("dragend", () => {
          const p = markerRef.current?.getPosition();
          if (p) onDragEnd({ lat: p.lat(), lng: p.lng() });
        });
      }
    } else {
      markerRef.current.setPosition(position);
      markerRef.current.setDraggable(draggable);
    }

    return () => {
      markerRef.current?.setMap(null);
      markerRef.current = null;
    };
  }, [map, position.lat, position.lng, draggable, title, onDragEnd, position]);

  return null;
}
