import { cn } from "@/lib/utils";

/**
 * Inline SVG Palestinian flag. Flag emoji do not render on Windows (they show
 * as the letters "PS" or empty boxes), so the phone-prefix badge uses this instead.
 */
export function PalestineFlag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 30 20"
      role="img"
      aria-label="علم فلسطين"
      className={cn("h-3.5 w-[21px] rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.08)] select-none", className)}
    >
      <rect width="30" height="6.67" y="0" fill="#000000" />
      <rect width="30" height="6.67" y="6.67" fill="#FFFFFF" />
      <rect width="30" height="6.66" y="13.34" fill="#007A3D" />
      <path d="M0 0 L12 10 L0 20 Z" fill="#CE1126" />
    </svg>
  );
}
