import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 ring-offset-white',
  {
    variants: {
      variant: {
        default: 'bg-ink-900 text-white hover:bg-ink-800',
        secondary: 'bg-ink-100 text-ink-900 hover:bg-ink-200',
        outline: 'border border-ink-200 bg-white text-ink-900 hover:bg-ink-100',
        ghost: 'bg-transparent text-ink-700 hover:bg-ink-100',
        subtle: 'bg-brass-300/20 text-brass-700 hover:bg-brass-300/30'
      },
      size: {
        sm: 'h-9 px-3',
        md: 'h-10 px-4',
        lg: 'h-11 px-6'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md'
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);

Button.displayName = 'Button';

export { Button, buttonVariants };
