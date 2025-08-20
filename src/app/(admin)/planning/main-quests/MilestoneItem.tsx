import TaskItem from './TaskItem';

interface Milestone {
  id: string;
  title: string;
  tasks: Task[];
}

interface Task {
  id: string;
  title: string;
  status: 'TODO' | 'DONE';
  subtasks: Subtask[];
}

interface Subtask {
  id: string;
  title: string;
  status: 'TODO' | 'DONE';
}

interface MilestoneItemProps {
  milestone: Milestone;
  activeTask: Task | null;
  onTaskSelect: (task: Task) => void;
}

export default function MilestoneItem({ milestone, activeTask, onTaskSelect }: MilestoneItemProps) {
  const tasks = milestone.tasks || [];

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">{milestone.title}</h3>
      {tasks.length > 0 ? (
        <div className="space-y-2">
          {tasks.map((task, idx) => (
            <TaskItem
              key={task.id}
              task={task}
              active={activeTask?.id === task.id}
              onOpenSubtask={() => onTaskSelect(task)}
              orderNumber={idx + 1}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">Belum ada tugas untuk milestone ini.</p>
      )}
    </div>
  );
} 