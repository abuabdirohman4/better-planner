import React from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@/lib/icons';

interface CollapsibleCardProps {
  children: React.ReactNode;
  isCollapsed: boolean;
  onToggle: () => void;
  className?: string;
  contentClassName?: string;
}

const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  children,
  isCollapsed,
  onToggle,
  className = '',
  contentClassName = '',
}) => {
  return (
    <div className={`relative ${className}`}>
      {/* Collapse Arrow - positioned absolutely */}
      <div className="absolute top-5 right-6 z-10">
        <button
          className="p-1 text-gray-500 hover:text-gray-900 transition-colors rounded rounded-full hover:text-gray-700 hover:shadow-md"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          aria-label={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? (
            <ChevronDownIcon className="w-5 h-5" />
          ) : (
            <ChevronUpIcon className="w-5 h-5" />
          )}
        </button>
      </div>
      
      {/* Content with height control */}
      <div className={`transition-all duration-300 ease-in-out ${
        isCollapsed ? 'max-h-16 overflow-hidden rounded-b-lg border-b border-gray-200 dark:border-gray-700' : 'max-h-none'
      }`}>
        {children}
      </div>
    </div>
  );
};

export default CollapsibleCard;
