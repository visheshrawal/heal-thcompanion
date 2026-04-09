import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 shadow-lg shadow-purple-500/20 text-white border border-white/10 hover:shadow-purple-500/30',
      destructive: 'bg-red-500/80 hover:bg-red-500 text-white shadow-lg shadow-red-500/20 border border-red-500/50',
      outline: 'border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 hover:border-white/20 text-white shadow-sm',
      ghost: 'hover:bg-white/10 hover:backdrop-blur-sm text-gray-300 hover:text-white'
    }
    
    const sizes = {
      default: 'px-4 py-2 text-sm',
      sm: 'px-3 py-1.5 text-xs',
      lg: 'px-6 py-3 text-base font-semibold'
    }
    
    return (
      <button
        className={cn(
          "rounded-xl font-medium transition-all duration-300 active:scale-95 flex items-center justify-center",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }