import React from 'react';

import type { TreeGoalItem } from './WeeklyGoalsTable';

interface TreeItemProps {
  item: TreeGoalItem;
  level: number;
  colorClass: string;
}

const TreeItem: React.FC<TreeItemProps> = ({ item, level, colorClass }) => {
  return (
    <>
      <div
        className="flex items-center space-x-2"
        style={{ paddingLeft: `${level * 1.5}rem` }}
      >
        <input
          type="checkbox"
          checked={item.status === 'DONE'}
          readOnly
          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
        <span className={`text-xs px-2 py-1 rounded ${colorClass}`}>{item.item_type}</span>
        <span className="text-sm text-gray-900 dark:text-white">{item.title}</span>
      </div>
      {item.children && item.children.length > 0 ? item.children
          .slice()
          .sort((a: TreeGoalItem, b: TreeGoalItem) => (a.display_order ?? 0) - (b.display_order ?? 0))
          .map((child: TreeGoalItem) => (
            <TreeItem key={child.id} item={child} level={level + 1} colorClass={colorClass} />
          )) : null}
    </>
  );
};

export default TreeItem; 