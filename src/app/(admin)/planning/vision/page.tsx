import type { Metadata } from "next";
import { getVisions, upsertVision } from './actions';
import { LIFE_AREAS } from './constants';
import Button from '@/components/ui/button/Button';
import Label from '@/components/form/Label';

export const metadata: Metadata = {
  title: "Vision | Better Planner",
  description: "Vision untuk aplikasi Better Planner",
};

type Vision = {
  life_area: string;
  vision_3_5_year?: string;
  vision_10_year?: string;
};

export default async function VisionPage() {
  const visions: Vision[] = await getVisions();
  return (
    <form action={upsertVision} className="space-y-6">
      <div className="overflow-x-auto">
        <table className="min-w-full border rounded-xl bg-white dark:bg-gray-900">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="w-64 px-4 py-3 text-left font-semibold">Area Kehidupan</th>
              <th className="px-4 py-3 text-left font-semibold">Visi 3-5 Tahun</th>
              <th className="px-4 py-3 text-left font-semibold">Visi 10 Tahun</th>
            </tr>
          </thead>
          <tbody>
            {LIFE_AREAS.map((area) => {
              const vision = visions.find((v) => v.life_area === area) ?? { life_area: area, vision_3_5_year: '', vision_10_year: '' };
              return (
                <tr key={area} className="border-t border-gray-200 dark:border-gray-800">
                  <td className="w-64 px-4 py-3 align-top font-medium text-gray-800 dark:text-white/90 whitespace-nowrap">{area}</td>
                  <td className="px-4 py-3 align-top">
                    <Label htmlFor={`${area}-vision_3_5_year`} className="sr-only">Visi 3-5 Tahun</Label>
                    <textarea
                      id={`${area}-vision_3_5_year`}
                      name={`${area}-vision_3_5_year`}
                      className="w-full rounded-lg border px-4 py-2.5 text-sm"
                      defaultValue={vision.vision_3_5_year}
                      rows={3}
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Label htmlFor={`${area}-vision_10_year`} className="sr-only">Visi 10 Tahun</Label>
                    <textarea
                      id={`${area}-vision_10_year`}
                      name={`${area}-vision_10_year`}
                      className="w-full rounded-lg border px-4 py-2.5 text-sm"
                      defaultValue={vision.vision_10_year}
                      rows={3}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end">
        <Button type="submit">Simpan Perubahan</Button>
      </div>
    </form>
  );
} 