"use client";

import { useEffect, useRef } from "react";

/** Subscribe a form's save handler to the global Ctrl/Cmd+S shortcut. */
export function useSaveShortcut(handler: () => void) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const fn = () => ref.current();
    window.addEventListener("miracle:save", fn as EventListener);
    return () => window.removeEventListener("miracle:save", fn as EventListener);
  }, []);
}
