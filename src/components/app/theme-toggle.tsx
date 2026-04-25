import { Monitor, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Toggle theme">
          {resolvedTheme === 'dark' ? <Moon /> : <Sun />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        <Item active={theme === 'light'} onSelect={() => setTheme('light')}>
          <Sun className="h-3.5 w-3.5" /> Light
        </Item>
        <Item active={theme === 'dark'} onSelect={() => setTheme('dark')}>
          <Moon className="h-3.5 w-3.5" /> Dark
        </Item>
        <Item active={theme === 'system'} onSelect={() => setTheme('system')}>
          <Monitor className="h-3.5 w-3.5" /> System
        </Item>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Item({
  children,
  active,
  onSelect,
}: {
  children: React.ReactNode;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <DropdownMenuItem
      onSelect={onSelect}
      className={cn(
        'gap-2 font-mono text-[11px] uppercase tracking-wider',
        active && 'bg-accent text-foreground',
      )}
    >
      {children}
    </DropdownMenuItem>
  );
}
