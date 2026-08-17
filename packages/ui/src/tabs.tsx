import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "./cn";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center gap-0 rounded-[9px] border border-stone-200 bg-stone-100 p-1 text-[13px] text-stone-500 dark:border-white/[0.16] dark:bg-[#1F1F1C] dark:text-stone-400",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-[7px] border-none px-3 py-1 text-[13px] font-medium outline-none transition-all hover:bg-stone-200/70 hover:text-stone-700 focus-visible:outline-none focus-visible:border-[#4568FF] focus-visible:shadow-[0_1px_2px_rgba(28,25,23,0.08),0_10px_20px_-14px_rgba(69,104,255,0.6)] disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-stone-800 data-[state=active]:shadow-[inset_0_1.5px_0_rgba(255,255,255,0.95),0_1px_2px_rgba(28,25,23,0.08)] dark:hover:bg-[#2A2A27] dark:hover:text-stone-200 dark:data-[state=active]:bg-[#252522] dark:data-[state=active]:text-stone-100",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 focus-visible:outline-none focus-visible:border-[#4568FF]",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
