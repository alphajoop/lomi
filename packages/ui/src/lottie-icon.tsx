import {
  useState,
  useRef,
  useEffect,
  memo,
  type CSSProperties,
  type ComponentType,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import LottieModule, { type LottieRefCurrentProps } from "lottie-react";

type LottieProps = {
  lottieRef?: Ref<LottieRefCurrentProps>;
  animationData: object;
  autoplay?: boolean;
  loop?: boolean;
  style?: CSSProperties;
};

function resolveLottieComponent(exported: unknown): ComponentType<LottieProps> {
  let current = exported;
  while (current && typeof current !== "function") {
    if (typeof current !== "object" || !("default" in current)) {
      break;
    }
    current = current.default;
  }
  if (typeof current !== "function") {
    throw new Error("lottie-react did not export a React component");
  }
  // SAFETY: typeof current === "function" is the React component lottie-react exports
  // (Vite CJS interop may wrap it as { default: Component }).
  return current as ComponentType<LottieProps>;
}

const Lottie = resolveLottieComponent(LottieModule);

/** Minimal JSON object shape used while recoloring Lottie vectors. */
type JsonObject = { [key: string]: JsonValue };
type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
/** Lottie assets may omit optional fields (`undefined` entries). */
type JsonInputObject = { [key: string]: JsonValue | undefined };

/** Lottie document JSON — imported assets may omit optional fields. */
export type LottieAnimationData = object;

export interface LottieIconCoreProps {
  animationData: string | LottieAnimationData;
  size?: number;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
  initialFrame?: number;
  isHovered?: boolean;
  customColor?: [number, number, number];
  /** When true, invert relative to light/dark the same way product apps do. */
  onInvertedSurface?: boolean;
  /** Resolved theme from the host app (`light` | `dark`). */
  theme: "light" | "dark";
  /** Fallback while animation data is missing. Defaults to a pulse placeholder. */
  loadingFallback?: ReactNode;
}

function isNumber<Value>(value: Value): value is Value & number {
  return typeof value === "number" && Number.isFinite(value);
}

function isString<Value>(value: Value): value is Value & string {
  return typeof value === "string";
}

function isJsonObject<Value>(value: Value): value is Value & JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(object: JsonInputObject, key: string): string | undefined {
  const value = object[key];
  return isString(value) ? value : undefined;
}

function readArray(object: JsonInputObject, key: string): JsonValue[] | undefined {
  const value = object[key];
  return Array.isArray(value)
    ? value.filter((item): item is JsonValue => item !== undefined)
    : undefined;
}

function readObject(object: JsonInputObject, key: string): JsonObject | undefined {
  const value = object[key];
  return isJsonObject(value) ? value : undefined;
}

const isColorVector = (value: JsonValue): value is number[] =>
  Array.isArray(value) &&
  (value.length === 3 || value.length === 4) &&
  value.every((channel) => isNumber(channel) && channel >= 0 && channel <= 1);

const isAnimationPath = (
  value: string | LottieAnimationData,
): value is string => isString(value);

const applyColorToVectorElements = (
  node: JsonValue | JsonInputObject,
  color: [number, number, number],
): boolean => {
  if (!isJsonObject(node)) return false;

  let changed = false;

  if (
    (node["ty"] === "fl" || node["ty"] === "st") &&
    isJsonObject(node["c"])
  ) {
    const colorRecord = node["c"];
    const colorVector = colorRecord["k"];
    if (colorVector !== undefined && isColorVector(colorVector)) {
      colorRecord["k"] = [...color, colorVector[3] ?? 1];
      changed = true;
    }
  }

  Object.values(node).forEach((value) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        changed = applyColorToVectorElements(item, color) || changed;
      });
    } else if (isJsonObject(value)) {
      changed = applyColorToVectorElements(value, color) || changed;
    }
  });

  return changed;
};

const LottieIconCoreComponent = ({
  animationData,
  size = 18,
  className = "",
  loop = false,
  autoplay = false,
  initialFrame,
  isHovered: externalHovered,
  customColor,
  onInvertedSurface = false,
  theme,
  loadingFallback,
}: LottieIconCoreProps): ReactElement => {
  const [internalHovered, setInternalHovered] = useState(false);
  const [animData, setAnimData] = useState<LottieAnimationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  const isHovered =
    externalHovered !== undefined ? externalHovered : internalHovered;

  useEffect(() => {
    if (!isAnimationPath(animationData)) {
      let processedData = animationData as JsonInputObject;
      const layers = readArray(processedData, "layers");

      if (customColor && layers !== undefined) {
        processedData = structuredClone(processedData);
        const clonedLayers = readArray(processedData, "layers") ?? [];
        let appliedCustomColor = false;
        const controlLayer = clonedLayers.find(
          (layer) =>
            isJsonObject(layer) &&
            readString(layer, "nm") === "control" &&
            readArray(layer, "ef") !== undefined,
        );
        if (controlLayer && isJsonObject(controlLayer)) {
          const effects = readArray(controlLayer, "ef") ?? [];
          const primaryEffect = effects.find(
            (effect) =>
              isJsonObject(effect) && readString(effect, "nm") === "primary",
          );
          if (primaryEffect && isJsonObject(primaryEffect)) {
            const controls = readArray(primaryEffect, "ef") ?? [];
            const colorControl = controls.find(
              (control) =>
                isJsonObject(control) && readString(control, "nm") === "Color",
            );
            if (colorControl && isJsonObject(colorControl)) {
              const value = readObject(colorControl, "v");
              const colorVector = value?.["k"];
              if (
                value &&
                colorVector !== undefined &&
                isColorVector(colorVector)
              ) {
                value["k"] = [...customColor, 1];
                appliedCustomColor = true;
              }
            }
          }
        }

        if (!appliedCustomColor) {
          applyColorToVectorElements(processedData, customColor);
        }
      }

      setAnimData(processedData);
      setIsLoading(false);
      return;
    }

    console.warn(
      `Using path string "${animationData}" for Lottie animation is deprecated. Pass animation data objects instead.`,
    );
    setAnimData(null);
    setIsLoading(false);
  }, [animationData, customColor]);

  useEffect(() => {
    if (lottieRef.current && animData && initialFrame !== undefined) {
      lottieRef.current.goToAndStop(initialFrame, true);
    }
  }, [animData, initialFrame]);

  useEffect(() => {
    if (lottieRef.current && animData) {
      if (isHovered) {
        lottieRef.current.play();
      } else if (!loop) {
        if (initialFrame !== undefined) {
          lottieRef.current.goToAndStop(initialFrame, true);
        } else {
          lottieRef.current.stop();
        }
      }
    }
  }, [isHovered, animData, initialFrame, loop]);

  const handleMouseEnter = () => {
    if (externalHovered === undefined) {
      setInternalHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (externalHovered === undefined) {
      setInternalHovered(false);
    }
  };

  if (isLoading || !animData) {
    return (
      <div
        className={`inline-flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        {isLoading && loadingFallback
          ? loadingFallback
          : (
            <div className="w-full h-full bg-muted-foreground/20 rounded-sm animate-pulse" />
          )}
      </div>
    );
  }

  const shouldApplyThemeFilter = !customColor;
  const isDark = theme === "dark";
  const useLightForeground = onInvertedSurface ? !isDark : isDark;
  const filterStyle = shouldApplyThemeFilter
    ? useLightForeground
      ? { filter: "invert(1) brightness(1.2)" }
      : { filter: "brightness(0.8)" }
    : {};

  return (
    <div
      className={`inline-flex items-center justify-center transition-all duration-200 ease-out ${
        isHovered ? "scale-110" : ""
      } ${className}`}
      style={{ width: size, height: size }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={animData}
        autoplay={autoplay}
        loop={loop}
        style={{
          width: size,
          height: size,
          ...filterStyle,
        }}
      />
    </div>
  );
};

export const LottieIconCore = memo(LottieIconCoreComponent);
LottieIconCore.displayName = "LottieIconCore";

type ThemedLottieIconProps = Omit<LottieIconCoreProps, "theme">;

export function createThemedLottieIcon(
  useTheme: () => { theme: string },
  loadingFallback: ReactNode,
) {
  const ThemedLottieIconComponent = (
    props: ThemedLottieIconProps,
  ): ReactElement => {
    const { theme } = useTheme();
    return (
      <LottieIconCore
        {...props}
        theme={theme === "dark" ? "dark" : "light"}
        loadingFallback={props.loadingFallback ?? loadingFallback}
      />
    );
  };
  const ThemedLottieIcon = memo(ThemedLottieIconComponent);
  ThemedLottieIcon.displayName = "LottieIcon";
  return ThemedLottieIcon;
}
