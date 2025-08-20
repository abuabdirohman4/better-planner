// Kosongkan file ini atau hapus semua isinya kecuali export default
// Karena fungsionalitasnya sudah disederhanakan dan dipindahkan

interface Subtask {
  id: string;
  title: string;
}

interface Task {
  title: string;
  subtasks: Subtask[];
}

export default function TaskDetailCard({ task, onBack }: { task: Task | null, onBack: () => void }) {
  if (!task) return null;
  const subtasks = task.subtasks || [];
  
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <button onClick={onBack} className="text-sm text-gray-500 mb-2">&larr; Kembali</button>
      <h3 className="font-bold">{task.title}</h3>
      <div className="mt-4">
        <h4 className="font-semibold text-sm mb-2">Sub-tasks:</h4>
        {subtasks.length > 0 ? (
          <div className="space-y-2">
            {subtasks.map((subtask) => (
              <div key={subtask.id} className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
                {subtask.title}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Tidak ada sub-task.</p>
        )}
      </div>
    </div>
  );
} 