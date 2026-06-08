"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Entry point — sends the user to the clinical workbench. */
export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);
  return (
    <div className="flex h-full items-center justify-center p-10 text-sm text-ink-400">
      Redirigiendo al tablero clínico…
    </div>
  );
}
