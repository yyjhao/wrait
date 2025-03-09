"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { PanelLeft, ChevronDown } from "lucide-react";

import { useIsMobile } from "./helpers/useIsMobile";
import { Sheet, SheetContent } from "./Sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./Tooltip";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "./Collapsible";
import { Button } from "./Button";
import styles from "./Sidebar.module.css";

const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

type SidebarContext = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContext | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }

  return context;
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile();
    const [openMobile, setOpenMobile] = React.useState(false);

    // This is the internal state of the sidebar.
    // We use openProp and setOpenProp for control from outside the component.
    const [_open, _setOpen] = React.useState(defaultOpen);
    const open = openProp ?? _open;
    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(open) : value;
        if (setOpenProp) {
          setOpenProp(openState);
        } else {
          _setOpen(openState);
        }
      },
      [setOpenProp, open]
    );

    // Helper to toggle the sidebar.
    const toggleSidebar = React.useCallback(() => {
      return isMobile
        ? setOpenMobile((open) => !open)
        : setOpen((open) => !open);
    }, [isMobile, setOpen, setOpenMobile]);

    // Adds a keyboard shortcut to toggle the sidebar.
    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault();
          toggleSidebar();
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [toggleSidebar]);

    const state = open ? "expanded" : "collapsed";

    const contextValue = React.useMemo<SidebarContext>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
    );

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <div
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH,
                ...style,
              } as React.CSSProperties
            }
            className={`${styles.wrapper} ${className ?? ""}`}
            ref={ref}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    );
  }
);
SidebarProvider.displayName = "SidebarProvider";

const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={className}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeft />
    </Button>
  );
});
SidebarTrigger.displayName = "SidebarTrigger";

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "left" | "right";
    collapsible?: "offcanvas" | "icon" | "none";
    header?: React.ReactNode;
    footer?: React.ReactNode;
  }
>(
  (
    {
      side = "left",
      collapsible = "offcanvas",
      className,
      children,
      header,
      footer,
      ...props
    },
    ref
  ) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

    const content = (
      <>
        {header && <div className={styles.sidebarHeader}>{header}</div>}
        <div className={styles.sidebarContentWrapper}>{children}</div>
        {footer && <div className={styles.sidebarFooter}>{footer}</div>}
      </>
    );

    if (collapsible === "none") {
      return (
        <div
          className={`${styles.sidebarBase} ${styles.sidebarFixed} ${className ?? ""}`}
          ref={ref}
          {...props}
        >
          {content}
        </div>
      );
    }

    if (isMobile) {
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
          <SheetContent
            className={`${styles.sidebarBase} ${styles.sidebarMobile}`}
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
              } as React.CSSProperties
            }
            side={side}
          >
            <div className={styles.sidebarMobileContent}>{content}</div>
          </SheetContent>
        </Sheet>
      );
    }

    return (
      <div
        ref={ref}
        className={`${styles.sidebarBase} ${styles.sidebarDesktop} ${styles["sidebarState-" + state]} ${state === "collapsed" ? styles["sidebarCollapsible-" + collapsible] : ""} ${styles["sidebarSide-" + side]}`}
      >
        {/* This is what handles the sidebar gap on desktop */}
        <div className={styles.sidebarGap} />
        <div className={`${styles.sidebarContent} ${className}`} {...props}>
          <div className={styles.sidebarContentInner}>{content}</div>
        </div>
      </div>
    );
  }
);
Sidebar.displayName = "Sidebar";

const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`${styles.sidebarGroup} ${className ?? ""}`}
      {...props}
    />
  );
});
SidebarGroup.displayName = "SidebarGroup";

const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      ref={ref}
      className={`${styles.sidebarGroupLabel} ${className ?? ""}`}
      {...props}
    />
  );
});
SidebarGroupLabel.displayName = "SidebarGroupLabel";

const SidebarGroupAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref}
      className={`${styles.sidebarGroupAction} ${className ?? ""}`}
      {...props}
    />
  );
});
SidebarGroupAction.displayName = "SidebarGroupAction";

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={`${styles.sidebarMenu} ${className ?? ""}`}
    {...props}
  />
));
SidebarMenu.displayName = "SidebarMenu";

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={`${styles.sidebarMenuItem} ${className ?? ""}`}
    {...props}
  />
));
SidebarMenuItem.displayName = "SidebarMenuItem";

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean;
    isActive?: boolean;
    tooltip?: string | React.ComponentProps<typeof TooltipContent>;
    size?: "sm" | "md" | "lg";
    variant?: "default" | "outline";
  }
>(
  (
    {
      asChild = false,
      isActive = false,
      variant = "default",
      size = "md",
      tooltip,
      className,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const { isMobile, state } = useSidebar();

    const button = (
      <Comp
        ref={ref}
        data-size={size}
        data-active={isActive}
        className={`${styles.sidebarMenuButton} ${styles["sidebarMenuButtonVariant-" + variant]} ${styles["sidebarMenuButtonSize-" + size]} ${isActive ? styles["sidebarMenuButtonActive"] : ""} ${className}`}
        {...props}
      />
    );

    if (!tooltip) {
      return button;
    }

    if (typeof tooltip === "string") {
      tooltip = {
        children: tooltip,
      };
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent
          side="right"
          align="center"
          hidden={state !== "collapsed" || isMobile}
          {...tooltip}
        />
      </Tooltip>
    );
  }
);
SidebarMenuButton.displayName = "SidebarMenuButton";

const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean;
    showOnHover?: boolean;
  }
>(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref}
      className={`${styles.sidebarMenuAction} ${showOnHover ? styles.sidebarMenuActionShowOnHover : ""} ${className ?? ""}`}
      {...props}
    />
  );
});
SidebarMenuAction.displayName = "SidebarMenuAction";

const SidebarMenuSub = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={`${styles.sidebarMenuSub} ${className ?? ""}`}
    {...props}
  />
));
SidebarMenuSub.displayName = "SidebarMenuSub";

const SidebarCollapsibleGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    groupLabel: string;
    defaultOpen?: boolean;
  }
>(({ className, groupLabel, defaultOpen = true, children, ...props }, ref) => {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <SidebarGroup ref={ref}>
        <SidebarGroupLabel
          asChild
          className={styles.collapsibleGroupLabel}
          {...props}
        >
          <CollapsibleTrigger>
            {groupLabel}
            <div className={styles.sidebarGroupAction}>
              <ChevronDown
                className={`${styles.collapsibleIcon} ${open ? styles.collapsibleOpen : ""}`}
              />
            </div>
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>{children}</CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
});
SidebarCollapsibleGroup.displayName = "SidebarCollapsibleGroup";

const SidebarCollapsibleItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li"> & {
    buttonLabel: React.ReactNode;
    defaultOpen?: boolean;
  }
>(({ className, buttonLabel, children, defaultOpen = true, ...props }, ref) => {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <SidebarMenuItem {...props}>
        <SidebarMenuButton>{buttonLabel}</SidebarMenuButton>
        <CollapsibleTrigger asChild>
          <SidebarMenuAction>
            <ChevronDown
              className={`${styles.collapsibleIcon} ${open ? styles.collapsibleOpen : ""}`}
            />
          </SidebarMenuAction>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>{children}</SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
});
SidebarCollapsibleItem.displayName = "SidebarCollapsibleItem";

export {
  useSidebar,
  SidebarProvider,
  Sidebar,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuSub,
  SidebarCollapsibleGroup,
  SidebarCollapsibleItem,
  SidebarTrigger,
};

