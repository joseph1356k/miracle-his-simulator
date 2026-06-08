"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { useFieldRegistry } from "@/lib/store/useFieldRegistry";
import { useUI } from "@/lib/store/useUI";

/* ------------------------------------------------------------- registration */

interface FieldMeta {
  id: string;
  testId: string;
  label: string;
  section?: string;
  type: string;
  required?: boolean;
  value: string;
}

function useFieldRegistration(meta: FieldMeta) {
  const pathname = usePathname();
  const register = useFieldRegistry((s) => s.register);
  const unregister = useFieldRegistry((s) => s.unregister);
  const updateValue = useFieldRegistry((s) => s.updateValue);

  useEffect(() => {
    register({
      testId: meta.testId,
      domId: meta.id,
      label: meta.label,
      section: meta.section ?? "General",
      route: pathname,
      type: meta.type,
      required: !!meta.required,
      value: meta.value ?? "",
    });
    return () => unregister(meta.testId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.testId, pathname]);

  useEffect(() => {
    updateValue(meta.testId, meta.value ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.value]);
}

/* -------------------------------------------------------------- field shell */

interface BaseFieldProps {
  id: string;
  name: string;
  label: string;
  testId: string;
  section?: string;
  required?: boolean;
  help?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
  labelClassName?: string;
}

function FieldShell({
  id,
  label,
  testId,
  required,
  help,
  error,
  containerClassName,
  labelClassName,
  children,
}: BaseFieldProps & { children: React.ReactNode }) {
  return (
    <div className={cn("min-w-0", containerClassName)} data-field-testid={testId}>
      <label htmlFor={id} className={cn("field-label", labelClassName)}>
        {label}
        {required && <span className="ml-0.5 text-rose-500" aria-hidden>*</span>}
      </label>
      {children}
      <div className="min-h-[14px]" aria-live="polite">
        {error ? (
          <p id={`${id}-error`} className="field-error" role="alert">{error}</p>
        ) : help ? (
          <p id={`${id}-help`} className="field-help">{help}</p>
        ) : null}
      </div>
    </div>
  );
}

function useEditSignals() {
  const setLastEditedField = useUI((s) => s.setLastEditedField);
  const setUnsaved = useUI((s) => s.setUnsavedChanges);
  return (testId: string) => {
    setLastEditedField(testId);
    setUnsaved(true);
  };
}

/* -------------------------------------------------------------- text field- */

export interface TextFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "search" | "date" | "datetime-local" | "time" | "number";
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  ariaLabel?: string;
}

export function TextField({
  value, onChange, placeholder, type = "text", inputMode, ariaLabel, ...base
}: TextFieldProps) {
  useFieldRegistration({ id: base.id, testId: base.testId, label: base.label, section: base.section, type, required: base.required, value: String(value ?? "") });
  const signal = useEditSignals();
  return (
    <FieldShell {...base}>
      <input
        id={base.id}
        name={base.name}
        data-testid={base.testId}
        type={type}
        inputMode={inputMode}
        aria-label={ariaLabel ?? base.label}
        aria-required={base.required || undefined}
        aria-invalid={base.error ? true : undefined}
        aria-describedby={base.error ? `${base.id}-error` : base.help ? `${base.id}-help` : undefined}
        required={base.required}
        disabled={base.disabled}
        placeholder={placeholder}
        value={value}
        onChange={(e) => { onChange(e.target.value); signal(base.testId); }}
        className={cn("field-input", base.error && "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20", base.className)}
      />
    </FieldShell>
  );
}

/* ---------------------------------------------------------- textarea field- */

export interface TextAreaFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  ariaLabel?: string;
}

export function TextAreaField({
  value, onChange, placeholder, rows = 3, ariaLabel, ...base
}: TextAreaFieldProps) {
  useFieldRegistration({ id: base.id, testId: base.testId, label: base.label, section: base.section, type: "textarea", required: base.required, value: String(value ?? "") });
  const signal = useEditSignals();
  return (
    <FieldShell {...base}>
      <textarea
        id={base.id}
        name={base.name}
        data-testid={base.testId}
        rows={rows}
        aria-label={ariaLabel ?? base.label}
        aria-required={base.required || undefined}
        aria-invalid={base.error ? true : undefined}
        aria-describedby={base.error ? `${base.id}-error` : base.help ? `${base.id}-help` : undefined}
        required={base.required}
        disabled={base.disabled}
        placeholder={placeholder}
        value={value}
        onChange={(e) => { onChange(e.target.value); signal(base.testId); }}
        className={cn("field-input resize-y leading-relaxed", base.error && "border-rose-400", base.className)}
      />
    </FieldShell>
  );
}

/* ------------------------------------------------------------ select field- */

export type SelectOption = { value: string; label: string } | string;

export interface SelectFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  ariaLabel?: string;
}

export function SelectField({
  value, onChange, options, placeholder, ariaLabel, ...base
}: SelectFieldProps) {
  useFieldRegistration({ id: base.id, testId: base.testId, label: base.label, section: base.section, type: "select", required: base.required, value: String(value ?? "") });
  const signal = useEditSignals();
  const normalized = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <FieldShell {...base}>
      <select
        id={base.id}
        name={base.name}
        data-testid={base.testId}
        aria-label={ariaLabel ?? base.label}
        aria-required={base.required || undefined}
        required={base.required}
        disabled={base.disabled}
        value={value}
        onChange={(e) => { onChange(e.target.value); signal(base.testId); }}
        className={cn("field-input appearance-none bg-white pr-8", base.className)}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {normalized.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </FieldShell>
  );
}

/* ---------------------------------------------------------- checkbox field- */

export interface CheckboxFieldProps {
  id: string;
  name: string;
  label: string;
  testId: string;
  section?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  disabled?: boolean;
}

export function CheckboxField({
  id, name, label, testId, section, checked, onChange, description, disabled,
}: CheckboxFieldProps) {
  useFieldRegistration({ id, testId, label, section, type: "checkbox", value: checked ? "true" : "false" });
  const signal = useEditSignals();
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5 rounded-md border border-ink-200 bg-white px-3 py-2 text-sm hover:bg-ink-50">
      <input
        id={id}
        name={name}
        data-testid={testId}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-label={label}
        onChange={(e) => { onChange(e.target.checked); signal(testId); }}
        className="mt-0.5 h-4 w-4 rounded border-ink-300 text-clinical-600 focus-ring"
      />
      <span>
        <span className="font-medium text-ink-800">{label}</span>
        {description && <span className="mt-0.5 block text-2xs text-ink-500">{description}</span>}
      </span>
    </label>
  );
}

/* --------------------------------------------------------- read-only field- */

export function ReadOnlyField({
  id, testId, label, value, section, className,
}: {
  id: string;
  testId: string;
  label: string;
  value: string;
  section?: string;
  className?: string;
}) {
  useFieldRegistration({ id, testId, label, section, type: "readonly", value: String(value ?? "") });
  return (
    <div className={cn("min-w-0", className)} data-field-testid={testId}>
      <span className="field-label">{label}</span>
      <p id={id} data-testid={testId} className="rounded-md border border-ink-200 bg-ink-50 px-2.5 py-1.5 text-sm text-ink-800">
        {value || "—"}
      </p>
    </div>
  );
}
