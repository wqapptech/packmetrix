"use client";

import { useEffect } from "react";

export default function TrackView({ id }: { id: string }) {
  useEffect(() => {
    fetch("/api/track-view", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });
  }, [id]);

  return null;
}