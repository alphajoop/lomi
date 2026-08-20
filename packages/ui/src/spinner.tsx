import React from "react";

interface SpinnerProps {
  className?: string;
  inline?: boolean;
  style?: React.CSSProperties;
}

/** Braille page spinner. Async submit controls use `@lomi./ui/interior/loading-button`. */
function Spinner({ className = "", inline = false, style }: SpinnerProps) {
  const spinnerChars = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  const [currentChar, setCurrentChar] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentChar((prev) => (prev + 1) % spinnerChars.length);
    }, 200);

    return () => clearInterval(interval);
  }, [spinnerChars.length]);

  const spinner = (
    <span
      className={`inline-flex items-center justify-center text-zinc-400 ${className}`}
      style={{
        fontFamily:
          '"DejaVu Sans Mono", "Liberation Mono", "Courier New", monospace',
        fontSize: "0.875rem",
        lineHeight: "1.25",
        fontWeight: "normal",
        verticalAlign: "baseline",
        position: "relative",
        top: "1px",
        ...style,
      }}
    >
      {spinnerChars[currentChar]}
    </span>
  );

  if (inline) {
    return spinner;
  }

  return (
    <div className="flex items-center justify-center w-full h-full">
      {spinner}
    </div>
  );
}

export { Spinner };
export default Spinner;
