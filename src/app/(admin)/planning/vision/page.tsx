import { getVisions, upsertVision } from './actions';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import Label from '@/components/form/Label';

const LIFE_AREAS = [
  'Karier/Bisnis',
  'Keuangan',
  'Kesehatan & Kebugaran',
  'Hubungan',
  'Pengembangan Diri',
  'Spiritual',
];

type Vision = {
  life_area: string;
  vision_3_5_year?: string;
  vision_10_year?: string;
};

export default async function VisionPage() {
  const visions: Vision[] = await getVisions();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {LIFE_AREAS.map((area) => {
        const vision = visions.find((v) => v.life_area === area) ?? { life_area: area, vision_3_5_year: '', vision_10_year: '' };
        return (
          <ComponentCard key={area} title={area}>
            <form action={upsertVision} className="space-y-4">
              <input type="hidden" name="life_area" value={area} />
              <div>
                <Label htmlFor={`vision_3_5_year_${area}`}>Visi 3-5 Tahun</Label>
                <textarea
                  id={`vision_3_5_year_${area}`}
                  name="vision_3_5_year"
                  className="w-full rounded-lg border px-4 py-2.5 text-sm"
                  defaultValue={vision.vision_3_5_year}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor={`vision_10_year_${area}`}>Visi 10 Tahun</Label>
                <textarea
                  id={`vision_10_year_${area}`}
                  name="vision_10_year"
                  className="w-full rounded-lg border px-4 py-2.5 text-sm"
                  defaultValue={vision.vision_10_year}
                  rows={3}
                />
              </div>
              <Button type="submit">Save</Button>
            </form>
          </ComponentCard>
        );
      })}
    </div>
  );
} 