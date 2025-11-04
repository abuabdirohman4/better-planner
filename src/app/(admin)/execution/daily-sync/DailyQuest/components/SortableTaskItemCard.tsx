import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskItemCard from './TaskItemCard';
import { TaskCardProps } from '../types';

interface SortableTaskItemCardProps extends TaskCardProps {
  id: string;
}

export default function SortableTaskItemCard({ id, ...props }: SortableTaskItemCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 20 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <TaskItemCard 
        {...props} 
        dragHandleProps={{
          listeners,
          attributes
        }}
      />
    </div>
  );
}

