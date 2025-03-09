"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import styles from "./Slider.module.css";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => {
  const isRange =
    (Array.isArray(props.defaultValue) && props.defaultValue.length > 1) ||
    (Array.isArray(props.value) && props.value.length > 1);

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={`${styles.slider} ${className ?? ""}`}
      {...props}
    >
      <SliderPrimitive.Track className={styles.track}>
        <SliderPrimitive.Range className={styles.range} />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className={styles.thumb} />
      {isRange && <SliderPrimitive.Thumb className={styles.thumb} />}
    </SliderPrimitive.Root>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
