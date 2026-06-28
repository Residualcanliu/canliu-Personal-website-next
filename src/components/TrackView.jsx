"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function TrackView() {
  const pathname = usePathname();
  const last = useRef("");

  useEffect(() => {
    if (pathname === last.current) return;
    last.current = pathname;
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
