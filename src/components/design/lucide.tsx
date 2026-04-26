import * as React from 'react';
import * as Icons from 'lucide-react';

type LuProps = {
  name: string;
  size?: number;
  stroke?: number;
  color?: string;
  style?: React.CSSProperties;
};

const cache: Record<string, any> = {};

function getIcon(name: string) {
  if (cache[name] !== undefined) return cache[name];
  const pascal = name
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
  const Icon = (Icons as any)[pascal];
  cache[name] = Icon || null;
  return cache[name];
}

export function Lu({
  name,
  size = 16,
  stroke = 1.75,
  color = 'currentColor',
  style,
}: LuProps) {
  const Icon = getIcon(name);
  if (!Icon) return null;
  return (
    <Icon
      size={size}
      strokeWidth={stroke}
      color={color}
      style={{
        display: 'inline-block',
        flexShrink: 0,
        verticalAlign: 'middle',
        ...style,
      }}
    />
  );
}
