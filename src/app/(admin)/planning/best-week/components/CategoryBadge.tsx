import React from 'react';
import { CATEGORY_CONFIG } from '@/lib/best-week/constants';
import type { ActivityCategory } from '@/lib/best-week/types';

interface CategoryBadgeProps {
  category: ActivityCategory;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

export default function CategoryBadge({ category, showIcon = true, size = 'sm' }: CategoryBadgeProps) {
  const config = CATEGORY_CONFIG[category];
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClass}`}
      style={{ backgroundColor: config.bgColor, color: config.color, border: `1px solid ${config.borderColor}` }}
    >
      {showIcon && <span>{config.icon}</span>}
      {config.label}
    </span>
  );
}
