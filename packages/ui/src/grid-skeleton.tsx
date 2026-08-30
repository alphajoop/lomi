import * as React from "react";
import { useEffect } from "react";
import { cn } from "./cn";

type SkeletonGridStyle = React.CSSProperties & {
  "--grid-size": string;
  "--grid-color": string;
  "--overlay-color": string;
};

export type GridSkeletonProps = {
  className?: string;
  gridSize?: number;
  "data-force-light"?: string | boolean;
  bgColor?: string;
  gridColor?: string;
  overlayColor?: string;
  roundedClassName?: string;
};

/**
 * Grid-pulse skeleton used by hosted checkout/storefront.
 * Distinct from the simple pulse `Skeleton` primitive.
 */
export function GridSkeleton({
  className = "",
  gridSize = 16,
  "data-force-light": forceLight,
  bgColor = "var(--skeleton-bg, #f8f9fa)",
  gridColor = "var(--skeleton-grid, rgba(230, 230, 230, 0.4))",
  overlayColor = "var(--skeleton-overlay, rgba(255, 255, 255, 0.7))",
  roundedClassName = "rounded-sm",
}: GridSkeletonProps) {
  useEffect(() => {
    const styleId = "skeleton-dynamic-styles";
    let styleElement = document.getElementById(styleId);

    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: .7; }
    }

    .skeleton-grid {
      background-image:
        linear-gradient(to right, transparent, transparent),
        linear-gradient(90deg, rgba(0,0,0,0) 0%, var(--overlay-color) 100%),
        linear-gradient(var(--grid-color) 1px, transparent 1px),
        linear-gradient(90deg, var(--grid-color) 1px, transparent 1px);
      background-size:
        100% 100%,
        100% 100%,
        var(--grid-size) var(--grid-size),
        var(--grid-size) var(--grid-size);
      background-position: 0 0, 0 0, 0 0, 0 0;
      background-blend-mode: normal, overlay, normal, normal;
      mask-image: linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.3) 100%);
      -webkit-mask-image: linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.3) 100%);
    }
    `;
  }, []);

  const gridStyle: SkeletonGridStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    "--grid-size": `${gridSize}px`,
    "--grid-color": gridColor,
    "--overlay-color": overlayColor,
  };

  return (
    <div
      className={cn("skeleton", roundedClassName, className)}
      {...(forceLight ? { "data-force-light": forceLight } : {})}
      style={{
        position: "relative",
        minHeight: "1rem",
        backgroundColor: bgColor,
        overflow: "hidden",
        animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      }}
    >
      <div className="skeleton-grid" style={gridStyle} />
    </div>
  );
}
