import { cn } from '@/lib/utils';

interface BadgeProps { children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'danger' }

export function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
      variant === 'default' && 'bg-zinc-700 text-zinc-300',
      variant === 'success' && 'bg-green-900/50 text-green-400',
      variant === 'warning' && 'bg-yellow-900/50 text-yellow-400',
      variant === 'danger' && 'bg-red-900/50 text-red-400',
    )}>
      {children}
    </span>
  );
}
