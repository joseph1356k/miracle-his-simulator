"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "subtle";
type Size = "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-clinical-600 text-white hover:bg-clinical-700 active:bg-clinical-800 border border-transparent shadow-sm",
  secondary: "bg-ink-900 text-white hover:bg-ink-800 border border-transparent shadow-sm",
  outline: "bg-white text-ink-800 border border-ink-300 hover:bg-ink-50",
  ghost: "bg-transparent text-ink-700 hover:bg-ink-100 border border-transparent",
  danger: "bg-rose-600 text-white hover:bg-rose-700 border border-transparent shadow-sm",
  subtle: "bg-clinical-50 text-clinical-700 border border-clinical-100 hover:bg-clinical-100",
};

const SIZES: Record<Size, string> = {
  sm: "h-7 px-2.5 text-xs gap-1.5 rounded-md",
  md: "h-9 px-3.5 text-sm gap-2 rounded-md",
  lg: "h-11 px-5 text-sm gap-2 rounded-lg",
  icon: "h-9 w-9 justify-center rounded-md",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center font-medium transition focus-ring disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
