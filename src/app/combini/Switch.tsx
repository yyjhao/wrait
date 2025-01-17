"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import styles from "./Switch.module.css"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={`${styles.root} ${className ?? ""}`}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={`${styles.thumb} ${className ?? ""}`}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
