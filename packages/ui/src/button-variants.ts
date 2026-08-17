import { cva } from "class-variance-authority";

const interiorInset =
  "shadow-[inset_0_1.5px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(28,25,23,0.06),0_1px_2px_rgba(28,25,23,0.08)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_1px_2px_rgba(0,0,0,0.4)]";

const interiorSurface =
  `border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 ${interiorInset} dark:border-white/[0.16] dark:bg-[#252522] dark:text-stone-200 dark:hover:bg-[#2A2A27]`;

const settingsButtonAction = `relative rounded-[9px] font-medium transition-[border-color,box-shadow,background-color] duration-150 ${interiorSurface}`;

const liveButton =
  `bg-brand-600 text-white border border-brand-600 hover:brightness-110 focus-visible:brightness-110 ${interiorInset} dark:border-transparent dark:bg-sky-900 dark:text-sky-300 dark:hover:brightness-100 dark:hover:bg-sky-800 dark:hover:text-sky-200`;

export const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[9px] text-[13px] font-medium ring-offset-background transition-[border-color,box-shadow,background-color] duration-150 select-none focus-visible:outline-none focus-visible:border-[#4568FF] focus-visible:shadow-[0_1px_2px_rgba(28,25,23,0.08),0_10px_20px_-14px_rgba(69,104,255,0.6)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:border-[#93B0FF] dark:focus-visible:shadow-[0_10px_20px_-14px_rgba(147,176,255,0.5)]",
  {
    variants: {
      variant: {
        default: `bg-stone-800 text-stone-50 border border-stone-800 hover:bg-stone-700 ${interiorInset} dark:border-white/[0.16] dark:bg-[#252522] dark:text-stone-200 dark:hover:bg-[#2A2A27]`,
        destructive: `bg-red-600 text-white border border-red-600 hover:bg-red-700 ${interiorInset} dark:border-transparent dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/40`,
        outline: interiorSurface,
        secondary: interiorSurface,
        ghost:
          "text-foreground hover:bg-stone-100 hover:text-foreground dark:hover:bg-[#2A2A27] dark:hover:text-stone-200",
        filter: interiorSurface,
        transparent: "bg-transparent border-0 shadow-none",
        link: "text-primary underline-offset-4 hover:underline",
        blue: liveButton,
        green: `bg-green-600 text-white border border-green-600 hover:bg-green-700 ${interiorInset} dark:border-transparent dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/40`,
        orange: `bg-orange-600 text-white border border-orange-600 hover:bg-orange-700 ${interiorInset} dark:border-transparent dark:bg-orange-900/30 dark:text-orange-300 dark:hover:bg-orange-900/40`,
        pink: `bg-pink-600 text-white border border-pink-600 hover:bg-pink-700 ${interiorInset} dark:border-transparent dark:bg-pink-900 dark:text-pink-300 dark:hover:bg-pink-900 dark:hover:text-pink-200`,
        cancel: interiorSurface,
        settings: settingsButtonAction,
        teal: `bg-teal-600 text-white border border-teal-600 hover:bg-teal-700 ${interiorInset} dark:border-transparent dark:bg-teal-900/30 dark:text-teal-300 dark:hover:bg-teal-900/40`,
        connect: interiorSurface,
        pointille: `border border-dashed border-stone-300 bg-white text-stone-700 hover:bg-stone-50 ${interiorInset} dark:border-white/25 dark:bg-[#252522] dark:text-stone-200`,
        dashed:
          "hover:bg-stone-100 hover:text-accent-foreground dark:hover:bg-[#2A2A27]",
        workspace: `text-[#4568FF] ${interiorSurface}`,
        auth: interiorSurface,
        promocode:
          "bg-sky-100/10 text-sky-600 hover:bg-sky-100/20 hover:text-sky-600 dark:bg-sky-900/30 dark:text-sky-300 dark:hover:bg-sky-900/40 dark:hover:text-sky-300",
      },
      size: {
        default: "h-9 px-3.5",
        xs: "h-7 px-2 text-xs",
        sm: "h-8 px-3",
        md: "h-9 px-3.5",
        lg: "h-11 px-5 text-[15px]",
        icon: "h-8 w-8",
        "icon-xs": "h-7 w-7",
        "icon-sm": "h-8 w-8",
        "icon-md": "h-9 w-9",
        header: "h-8 px-3.5",
        sidebarActions: "h-8 px-3.5 justify-start",
        small: "h-7 w-7 p-0",
        sidebar: "h-7 py-2 w-56",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

/** Exported for calendar and other consumers that need the settings action surface. */
export const settingsButtonActionClassName = settingsButtonAction;
