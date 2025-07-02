import { getMilestonesForQuest, addMilestone } from '../quests/actions';
import MilestoneItem from './MilestoneItem';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import InputField from '@/components/form/input/InputField';
import CustomToast from '@/components/ui/toast/CustomToast';
import { useState, useEffect } from 'react';

type Milestone = { id: string; title: string; display_order: number };

interface QuestDetailCardProps {
  quest: { id: string; title: string; motivation?: string; milestones?: Milestone[] };
}

export default function QuestDetailCard({ quest }: QuestDetailCardProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMilestones, setLoadingMilestones] = useState(true);

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
        // Optionally show toast
      } else {
        // Optionally show error toast
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComponentCard title={quest.title} className="mb-4">
      {quest.motivation && (
        <p className="text-gray-600 mb-2">{quest.motivation}</p>
      )}
      <div className="space-y-4 mb-4">
        {loadingMilestones ? (
          <p className="text-gray-400">Memuat milestone...</p>
        ) : milestones && milestones.length > 0 ? (
          milestones.map((milestone: Milestone) => (
            <MilestoneItem key={milestone.id} milestone={milestone} />
          ))
        ) : (
          <p className="text-gray-400">Belum ada milestone.</p>
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
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
    </ComponentCard>
  );
} 