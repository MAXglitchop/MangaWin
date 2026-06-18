import { cn } from "@/lib/utils";

/* ===== PAGE HEADER ===== */

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-5 shrink-0 bg-[var(--color-bg-base)]">
      <div>
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-[var(--color-text-tertiary)] mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}

/* ===== SKELETON ===== */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

export function MangaCardSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="w-full aspect-[2/3] rounded-[var(--radius-sm)]" />
      <Skeleton className="h-4 w-full rounded-sm" />
      <Skeleton className="h-3 w-2/3 rounded-sm" />
    </div>
  );
}

/* ===== EMPTY STATE ===== */

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6">
      <div className="text-[var(--color-text-muted)] mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
        {title}
      </h3>
      <p className="text-sm text-[var(--color-text-tertiary)] text-center max-w-sm mb-6">
        {description}
      </p>
      {action}
    </div>
  );
}

/* ===== BADGE ===== */

interface BadgeProps {
  variant?: "accent" | "success" | "warning" | "error" | "default";
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "badge",
        variant === "accent" && "badge-accent",
        variant === "success" && "badge-success",
        variant === "warning" && "badge-warning",
        variant === "error" && "badge-error",
        variant === "default" && "bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] border border-[var(--color-border)]",
        className
      )}
    >
      {children}
    </span>
  );
}

/* ===== ICON BUTTON ===== */

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "ghost" | "filled" | "outline";
  size?: "sm" | "md" | "lg";
}

export function IconButton({
  variant = "ghost",
  size = "md",
  className,
  children,
  ...props
}: IconButtonProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-[var(--radius-sm)]",
        "transition-colors duration-200 focus-ring",
        sizeClasses[size],
        variant === "ghost" && [
          "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
          "hover:bg-[var(--color-surface-hover)] active:bg-[var(--color-surface-active)]",
        ],
        variant === "filled" && [
          "text-white bg-[var(--color-accent)]",
          "hover:bg-[var(--color-accent-hover)]",
        ],
        variant === "outline" && [
          "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
          "border border-[var(--color-border-subtle)] hover:border-[var(--color-border-hover)]",
          "hover:bg-[var(--color-surface-hover)]",
        ],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* ===== BUTTON ===== */

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-2.5 text-base gap-2",
  };

  return (
    <button
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-[var(--radius-sm)]",
        "font-medium transition-colors duration-200 focus-ring",
        "disabled:opacity-50 disabled:pointer-events-none",
        sizeClasses[size],
        variant === "primary" && [
          "text-white bg-[var(--color-accent)]",
          "hover:bg-[var(--color-accent-hover)]",
        ],
        variant === "secondary" && [
          "text-[var(--color-accent)] bg-transparent",
          "border border-[var(--color-border-subtle)]",
          "hover:bg-[var(--color-accent-subtle)] hover:border-[var(--color-accent)]",
        ],
        variant === "ghost" && [
          "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
          "hover:bg-[var(--color-surface-hover)] active:bg-[var(--color-surface-active)]",
        ],
        variant === "danger" && [
          "text-white bg-[var(--color-error)] hover:bg-red-600",
        ],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* ===== SEARCH INPUT ===== */

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder = "Search...", className }: SearchInputProps) {
  return (
    <div className={cn("relative group", className)}>
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.2-5.2m0 0A7.5 7.5 0 1 0 5.8 5.8a7.5 7.5 0 0 0 10 10z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full pl-9 pr-4 py-2 text-sm rounded-[var(--radius-sm)]",
          "bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]",
          "text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]",
          "focus:outline-none focus:border-[var(--color-border-focus)]",
          "transition-colors duration-200"
        )}
      />
    </div>
  );
}
