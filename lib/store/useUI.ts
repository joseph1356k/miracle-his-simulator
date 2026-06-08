"use client";

import { create } from "zustand";

export type ToastVariant = "default" | "success" | "warning" | "danger" | "info";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface UIState {
  toasts: Toast[];
  addToast: (t: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;

  // Global panels / overlays
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  miracleOverlayOpen: boolean;
  toggleMiracleOverlay: () => void;
  setMiracleOverlay: (open: boolean) => void;
  auditPanelOpen: boolean;
  toggleAuditPanel: () => void;
  setAuditPanel: (open: boolean) => void;
  patientDrawerOpen: boolean;
  setPatientDrawer: (open: boolean) => void;

  // Debug metadata surfaced in the Miracle overlay
  lastEditedField?: string;
  setLastEditedField: (testId: string) => void;
  unsavedChanges: boolean;
  setUnsavedChanges: (v: boolean) => void;
  activeModal?: string;
  setActiveModal: (name?: string) => void;
}

let toastSeq = 0;

export const useUI = create<UIState>((set) => ({
  toasts: [],
  addToast: (t) => {
    toastSeq += 1;
    const id = `toast-${toastSeq}`;
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    if (typeof window !== "undefined") {
      setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 4200);
    }
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),

  commandOpen: false,
  setCommandOpen: (open) => set({ commandOpen: open }),
  miracleOverlayOpen: false,
  toggleMiracleOverlay: () => set((s) => ({ miracleOverlayOpen: !s.miracleOverlayOpen })),
  setMiracleOverlay: (open) => set({ miracleOverlayOpen: open }),
  auditPanelOpen: false,
  toggleAuditPanel: () => set((s) => ({ auditPanelOpen: !s.auditPanelOpen })),
  setAuditPanel: (open) => set({ auditPanelOpen: open }),
  patientDrawerOpen: false,
  setPatientDrawer: (open) => set({ patientDrawerOpen: open }),

  lastEditedField: undefined,
  setLastEditedField: (testId) => set({ lastEditedField: testId }),
  unsavedChanges: false,
  setUnsavedChanges: (v) => set({ unsavedChanges: v }),
  activeModal: undefined,
  setActiveModal: (name) => set({ activeModal: name }),
}));
