import * as React from "react"
import { cn } from "@/lib/utils"

export interface SliderProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue"> {
  value: number[]
  defaultValue?: number[]
  onValueChange?: (value: number[]) => void
  min?: number
  max?: number
  step?: number
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value, defaultValue, onValueChange, min = 0, max = 100, step = 1, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Number(e.target.value)
      if (onValueChange) {
        onValueChange([val])
      }
    }

    return (
      <input
        type="range"
        className={cn(
          "w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        min={min}
        max={max}
        step={step}
        value={value?.[0]}
        defaultValue={defaultValue?.[0]}
        onChange={handleChange}
        {...props}
      />
    )
  }
)
Slider.displayName = "Slider"

export { Slider }
