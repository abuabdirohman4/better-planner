"use client";
import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import InputField from '@/components/form/input/InputField';
import Button from '@/components/ui/button/Button';
import Checkbox from '@/components/form/input/Checkbox';
import CustomToast from '@/components/ui/toast/CustomToast';
import { updateTask } from '../quests/actions';

interface Subtask {
  id: string;
  title: string;
  status: 'TODO' | 'DONE';
}

export default function SubtaskModal({ open, onClose, parentTaskId, milestoneId, onSubtasksChanged }: { open: boolean; onClose: () => void; parentTaskId: string; milestoneId?: string; onSubtasksChanged?: () => void }) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSubtasks, setLoadingSubtasks] = useState(true);
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editSubtaskValue, setEditSubtaskValue] = useState('');
  const [editSubtaskLoading, setEditSubtaskLoading] = useState(false);

  const fetchSubtasks = async () => {
    setLoadingSubtasks(true);
    try {
      const res = await fetch(`/api/tasks?parent_task_id=${parentTaskId}`);
      const data = await res.json();
      setSubtasks(data.tasks || []);
    } finally {
      setLoadingSubtasks(false);
    }
  };

  useEffect(() => {
    if (open) fetchSubtasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, parentTaskId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_task_id: parentTaskId, title: input, milestone_id: milestoneId })
      });
      const data = await res.json();
      if (res.ok) {
        setInput('');
        fetchSubtasks();
        if (onSubtasksChanged) onSubtasksChanged();
        CustomToast.success(typeof data.message === 'string' ? data.message : 'Sub-tugas berhasil ditambahkan');
      } else {
        console.error('Response error dari backend:', data);
        CustomToast.error(
          typeof data.error === 'string'
            ? data.error
            : (data.error && data.error.message)
              ? data.error.message
              : 'Gagal menambah sub-tugas'
        );
      }
    } catch (err) {
      console.error('Error saat menambah sub-tugas:', err);
      CustomToast.error('Gagal menambah sub-tugas');
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = async (subtask: Subtask) => {
    try {
      const newStatus = subtask.status === 'DONE' ? 'TODO' : 'DONE';
      const res = await fetch(`/api/tasks/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: subtask.id, newStatus })
      });
      const data = await res.json();
      if (res.ok) {
        fetchSubtasks();
        if (onSubtasksChanged) onSubtasksChanged();
        CustomToast.success(typeof data.message === 'string' ? data.message : 'Status sub-tugas diupdate');
      } else {
        CustomToast.error(data.error || 'Gagal update status');
      }
    } catch {
      CustomToast.error('Gagal update status');
    }
  };

  const handleEditSubtask = (subtask: Subtask) => {
    setEditingSubtaskId(subtask.id);
    setEditSubtaskValue(subtask.title);
  };

  const handleEditSubtaskCancel = () => {
    setEditingSubtaskId(null);
    setEditSubtaskValue('');
  };

  const handleEditSubtaskSave = async (subtask: Subtask) => {
    if (!editSubtaskValue.trim()) return;
    setEditSubtaskLoading(true);
    try {
      await updateTask(subtask.id, editSubtaskValue);
      setEditingSubtaskId(null);
      setEditSubtaskValue('');
      fetchSubtasks();
      if (onSubtasksChanged) onSubtasksChanged();
      CustomToast.success('Sub-tugas berhasil diupdate');
    } catch (e) {
      CustomToast.error('Gagal update sub-tugas');
    } finally {
      setEditSubtaskLoading(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} showCloseButton>
      <div className="p-4 min-w-[320px] max-w-[400px]">
        <h2 className="text-lg font-bold mb-4">Detail Sub-tugas</h2>
        <div className="space-y-2 mb-4">
          {loadingSubtasks ? (
            <p className="text-gray-400 text-sm">Memuat sub-tugas...</p>
          ) : subtasks.length > 0 ? (
            subtasks.map((subtask) => (
              <label key={subtask.id} className="flex items-center gap-2 cursor-pointer select-none">
                <Checkbox checked={subtask.status === 'DONE'} onChange={() => handleCheck(subtask)} />
                {editingSubtaskId === subtask.id ? (
                  <>
                    <input
                      className="border rounded px-2 py-1 text-sm mr-2"
                      value={editSubtaskValue}
                      onChange={e => setEditSubtaskValue(e.target.value)}
                      disabled={editSubtaskLoading}
                      autoFocus
                    />
                    <button onClick={() => handleEditSubtaskSave(subtask)} disabled={editSubtaskLoading} className="text-brand-600 font-bold text-xs mr-1">Simpan</button>
                    <button onClick={handleEditSubtaskCancel} disabled={editSubtaskLoading} className="text-gray-400 text-xs">Batal</button>
                  </>
                ) : (
                  <>
                    <span className={subtask.status === 'DONE' ? 'line-through text-gray-400' : ''}>{subtask.title}</span>
                    <button type="button" onClick={() => handleEditSubtask(subtask)} className="ml-2 text-xs text-brand-500 underline">Edit</button>
                  </>
                )}
              </label>
            ))
          ) : (
            <p className="text-gray-400 text-sm">Belum ada sub-tugas.</p>
          )}
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
          <InputField
            name="title"
            placeholder="Tambah sub-tugas baru..."
            required
            className="flex-1"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
          />
          <Button type="submit" size="sm" variant="primary" disabled={loading}>
            {loading ? 'Menambah...' : 'Tambah'}
          </Button>
        </form>
      </div>
    </Modal>
  );
} 