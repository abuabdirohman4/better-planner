import { useEffect, useState } from 'react';
import MilestoneItem from './MilestoneItem';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import InputField from '@/components/form/input/InputField';
import CustomToast from '@/components/ui/toast/CustomToast';
import { updateQuestMotivation } from '../quests/actions';

interface Milestone {
  id: string;
  title: string;
  display_order: number;
}

export default function QuestWorkspace({ quest }: { quest: { id: string; title: string; motivation?: string } }) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMilestones, setLoadingMilestones] = useState(true);
  const [isEditingMotivation, setIsEditingMotivation] = useState(false);
  const [motivationValue, setMotivationValue] = useState(quest.motivation || '');
  const [motivationLoading, setMotivationLoading] = useState(false);

  const fetchMilestones = async () => {
    setLoadingMilestones(true);
    try {
      const res = await fetch(`/api/milestones?quest_id=${quest.id}`);
      const data = await res.json();
      setMilestones(data.milestones || []);
    } finally {
      setLoadingMilestones(false);
    }
  };

  useEffect(() => {
    fetchMilestones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quest.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quest_id: quest.id, title: input })
      });
      const data = await res.json();
      if (res.ok) {
        setInput('');
        fetchMilestones();
        CustomToast.success(data.message || 'Milestone berhasil ditambahkan');
      } else {
        CustomToast.error(data.error || 'Gagal menambah milestone');
      }
    } catch {
      CustomToast.error('Gagal menambah milestone');
    } finally {
      setLoading(false);
    }
  };

  const handleEditMotivation = () => {
    setIsEditingMotivation(true);
    setMotivationValue(quest.motivation || '');
  };

  const handleCancelMotivation = () => {
    setIsEditingMotivation(false);
    setMotivationValue(quest.motivation || '');
  };

  const handleSaveMotivation = async () => {
    setMotivationLoading(true);
    try {
      await updateQuestMotivation(quest.id, motivationValue);
      setIsEditingMotivation(false);
      CustomToast.success('Motivation berhasil diupdate');
    } catch {
      CustomToast.error('Gagal update motivation');
    } finally {
      setMotivationLoading(false);
    }
  };

  return (
    <ComponentCard title={quest.title} classNameTitle='text-center'>
      <label>Motivasi terbesar saya untuk mencapai Goal ini :</label>
      <div>
        {isEditingMotivation ? (
          <div className="flex flex-col items-start gap-2 mb-2">
            <textarea
              className="border rounded px-2 py-1 text-sm w-full max-w-xl"
              value={motivationValue}
              onChange={e => setMotivationValue(e.target.value)}
              disabled={motivationLoading}
              rows={2}
            />
            <div className="flex gap-2">
              <button onClick={handleSaveMotivation} disabled={motivationLoading} className="text-brand-600 font-bold text-xs">Simpan</button>
              <button onClick={handleCancelMotivation} disabled={motivationLoading} className="text-gray-400 text-xs">Batal</button>
            </div>
          </div>
        ) : (
          <div className="text-start text-gray-600 mb-2">
            {motivationValue || <span className="italic text-gray-400">Belum ada motivation</span>}
            <button onClick={handleEditMotivation} className="ml-2 text-xs text-brand-500 underline">Edit Motivation</button>
          </div>
        )}
      </div>
      <div className="space-y-4 mb-4">
        {loadingMilestones ? (
          <p className="text-gray-400">Memuat milestone...</p>
        ) : (
          Array.from({ length: 3 }).map((_, idx) => {
            const milestone = milestones[idx];
            if (milestone) {
              return <MilestoneItem key={milestone.id} milestone={milestone} />;
            } else {
              return (
                <div key={idx} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-between min-h-[56px]">
                  <form onSubmit={handleSubmit} className="flex gap-2 w-full">
                    <InputField
                      name="title"
                      placeholder="Tambah milestone baru..."
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
              );
            }
          })
        )}
      </div>
    </ComponentCard>
  );
} 