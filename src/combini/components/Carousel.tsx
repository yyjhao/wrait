"use client";

import * as React from "react";
import useEmblaCarousel from "embla-carousel-react";
import {
  type EmblaCarouselType as CarouselApi,
  type EmblaOptionsType,
  type EmblaPluginType,
} from "embla-carousel";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Button } from "./Button";
import styles from "./Carousel.module.css";

type CarouselProps = {
  opts?: EmblaOptionsType;
  plugins?: EmblaPluginType[];
  orientation?: "horizontal" | "vertical";
  setApi?: (api: CarouselApi) => void;
  className?: string;
};

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  api: ReturnType<typeof useEmblaCarousel>[1];
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
} & CarouselProps;

const CarouselContext = React.createContext<CarouselContextProps>(null!);

function useCarousel() {
  const context = React.useContext(CarouselContext);

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }

  return context;
}

const Carousel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & CarouselProps
>(
  (
    {
      orientation = "horizontal",
      opts,
      setApi,
      plugins,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [carouselRef, api] = useEmblaCarousel(
      {
        ...opts,
        axis: orientation === "horizontal" ? "x" : "y",
      },
      plugins
    );
    const [canScrollPrev, setCanScrollPrev] = React.useState(false);
    const [canScrollNext, setCanScrollNext] = React.useState(false);

    const scrollPrev = React.useCallback(() => api?.scrollPrev(), [api]);
    const scrollNext = React.useCallback(() => api?.scrollNext(), [api]);

    const onSelect = React.useCallback((api: CarouselApi) => {
      if (!api) return;

      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    }, []);

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          scrollPrev();
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          scrollNext();
        }
      },
      [scrollPrev, scrollNext]
    );

    React.useEffect(() => {
      if (!api || !setApi) {
        return;
      }

      setApi(api);
    }, [api, setApi]);

    React.useEffect(() => {
      if (!api) {
        return;
      }

      onSelect(api);
      api.on("reInit", onSelect);
      api.on("select", onSelect);

      return () => {
        api?.off("select", onSelect);
      };
    }, [api, onSelect]);

    return (
      <CarouselContext.Provider
        value={{
          carouselRef,
          api: api,
          opts,
          orientation:
            orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
          scrollPrev,
          scrollNext,
          canScrollPrev,
          canScrollNext,
        }}
      >
        <div
          ref={ref}
          onKeyDownCapture={handleKeyDown}
          className={`${styles.carousel} ${className}`}
          role="region"
          aria-roledescription="carousel"
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    );
  }
);

Carousel.displayName = "Carousel";

const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { carouselRef, orientation } = useCarousel();

  return (
    <div className={styles.viewport} ref={carouselRef}>
      <div
        ref={ref}
        className={`${styles.container} ${
          orientation === "horizontal" ? styles.horizontal : styles.vertical
        } ${className || ""}`}
        {...props}
      >
        {children}
      </div>
    </div>
  );
});
CarouselContent.displayName = "CarouselContent";

const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { orientation } = React.useContext(CarouselContext) || {};

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={`${styles.item} ${
        orientation === "horizontal" ? styles.horizontal : styles.vertical
      } ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  );
});

CarouselItem.displayName = "CarouselItem";

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel();

  const Icon = orientation === "horizontal" ? ChevronLeft : ChevronUp;

  return (
    <div
      className={`${styles.previousButtonContainer} ${
        orientation === "horizontal" ? styles.horizontalNav : styles.verticalNav
      }`}
    >
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={`${styles.previous} ${className || ""}`}
        disabled={!canScrollPrev}
        onClick={scrollPrev}
        {...props}
      >
        <Icon className={styles.icon} />
        <span className={styles.srOnly}>Previous slide</span>
      </Button>
    </div>
  );
});
CarouselPrevious.displayName = "CarouselPrevious";

const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollNext, canScrollNext } = useCarousel();

  const Icon = orientation === "horizontal" ? ChevronRight : ChevronDown;
  return (
    <div
      className={`${styles.nextButtonContainer} ${
        orientation === "horizontal" ? styles.horizontalNav : styles.verticalNav
      }`}
    >
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={`${styles.next} ${className || ""}`}
        disabled={!canScrollNext}
        onClick={scrollNext}
        {...props}
      >
        <Icon className={styles.icon} />
        <span className={styles.srOnly}>Next slide</span>
      </Button>
    </div>
  );
});
CarouselNext.displayName = "CarouselNext";

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
};
