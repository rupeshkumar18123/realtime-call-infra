import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
}

export function Button({ children, variant = 'primary', loading, className, disabled, ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'primary' && 'bg-blue-600 hover:bg-blue-700 text-white',
        variant === 'secondary' && 'bg-zinc-700 hover:bg-zinc-600 text-white',
        variant === 'danger' && 'bg-red-600 hover:bg-red-700 text-white',
        className,
      )}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}
