"use client";

import { create } from "zustand";
import type { RegisteredField } from "@/lib/types";

/**
 * Runtime registry of every visible, automation-relevant field on the current
 * screen. Field components register on mount, update on change, and unregister
 * on unmount. The Miracle overlay + field map read from here.
 */
interface FieldRegistryState {
  fields: Record<string, RegisteredField>;
  register: (field: RegisteredField) => void;
  updateValue: (testId: string, value: string) => void;
  unregister: (testId: string) => void;
  clearRoute: (route: string) => void;
  list: () => RegisteredField[];
}

export const useFieldRegistry = create<FieldRegistryState>((set, get) => ({
  fields: {},
  register: (field) =>
    set((s) => ({ fields: { ...s.fields, [field.testId]: field } })),
  updateValue: (testId, value) =>
    set((s) => {
      const existing = s.fields[testId];
      if (!existing) return s;
      return { fields: { ...s.fields, [testId]: { ...existing, value } } };
    }),
  unregister: (testId) =>
    set((s) => {
      const next = { ...s.fields };
      delete next[testId];
      return { fields: next };
    }),
  clearRoute: (route) =>
    set((s) => {
      const next: Record<string, RegisteredField> = {};
      for (const [k, v] of Object.entries(s.fields)) {
        if (v.route !== route) next[k] = v;
      }
      return { fields: next };
    }),
  list: () => Object.values(get().fields),
}));
