import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground border-border",
        // Custom variants
        sale: "border-transparent bg-destructive text-destructive-foreground font-semibold",
        new: "border-transparent bg-accent text-accent-foreground font-semibold",
        bestseller: "border-transparent bg-oak text-primary-foreground font-semibold",
        limited: "border-transparent bg-terracotta text-primary-foreground font-semibold",
        stock: "border-transparent bg-muted text-muted-foreground",
        inStock: "border-transparent bg-accent/20 text-accent font-medium",
        outOfStock: "border-transparent bg-destructive/20 text-destructive font-medium",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
