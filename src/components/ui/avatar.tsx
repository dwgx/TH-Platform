import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '@/lib/utils';

export const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex shrink-0 overflow-hidden rounded-full',
      className,
    )}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

export const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full', className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const fallbackPalette: Record<string, string> = {
  Y: 'from-indigo-400 to-indigo-700',
  M: 'from-fuchsia-400 to-fuchsia-700',
  R: 'from-rose-400 to-rose-700',
  A: 'from-teal-400 to-teal-700',
  S: 'from-violet-400 to-violet-700',
  K: 'from-amber-400 to-amber-700',
  P: 'from-sky-400 to-sky-700',
  C: 'from-emerald-400 to-emerald-700',
  D: 'from-blue-400 to-blue-700',
};

export const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> & {
    name?: string;
  }
>(({ className, name = '', children, ...props }, ref) => {
  const initial = (name[0] ?? 'X').toUpperCase();
  const grad = fallbackPalette[initial] ?? 'from-zinc-400 to-zinc-700';
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full text-[11px] font-semibold text-white',
        `bg-gradient-to-br ${grad}`,
        className,
      )}
      {...props}
    >
      {children ?? initial}
    </AvatarPrimitive.Fallback>
  );
});
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;
