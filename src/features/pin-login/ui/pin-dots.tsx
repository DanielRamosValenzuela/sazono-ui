type PinDotsProps = {
  length: number;
  filled: number;
  hasError?: boolean;
};

export function PinDots({ length, filled, hasError }: PinDotsProps) {
  return (
    <div
      className="flex items-center justify-center gap-4"
      role="status"
      aria-live="polite"
    >
      {Array.from({ length }).map((_, index) => {
        const isFilled = index < filled;
        const isLatest = index === filled - 1;

        return (
          <span
            key={index}
            className={`block rounded-full transition-all duration-200 ${
              isFilled
                ? `size-3.5 ${hasError ? "bg-destructive" : "bg-primary"} ${
                    isLatest ? "animate-in zoom-in-50 duration-200" : ""
                  }`
                : "size-3 border-2 border-border"
            }`}
          />
        );
      })}
    </div>
  );
}
