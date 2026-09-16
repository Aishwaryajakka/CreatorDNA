import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-control)] text-sm font-semibold cursor-pointer transition-[color,background-color,border-color,box-shadow,transform] duration-200 active:translate-y-px active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        primary:
          "border border-chartreuse bg-chartreuse font-black uppercase tracking-wider text-[#050811] shadow-[0_8px_20px_-12px_rgb(232_243_26_/_0.72)] hover:bg-chartreuse hover:shadow-[0_10px_24px_-10px_rgb(232_243_26_/_0.78)]",
        product:
          "border border-primary bg-primary font-black uppercase tracking-wider text-primary-foreground shadow-[0_8px_20px_-12px_rgb(21_94_239_/_0.65)] hover:bg-[#2563ff]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "border border-aqua-accent bg-midnight font-black uppercase tracking-wider text-aqua-accent hover:bg-[color-mix(in_srgb,var(--midnight)_92%,var(--aqua-accent))]",
        ghost:
          "border border-transparent text-muted-foreground hover:border-border hover:bg-accent hover:text-foreground",
        filter:
          "border border-border bg-card font-mono text-xs font-bold uppercase tracking-wide text-muted-foreground shadow-none hover:border-aqua-accent hover:bg-aqua-accent/10 hover:text-midnight",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-5 text-sm",
        card: "h-9 px-4 text-xs",
        lg: "h-10 px-8",
        xl: "h-10 px-5 text-sm",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
