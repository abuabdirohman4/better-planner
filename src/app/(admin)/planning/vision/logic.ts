import type { VisionEntry } from '@/types/vision';
export type { VisionEntry };

export function parseVisionFormData(formData: FormData, lifeAreas: string[]): VisionEntry[] {
  return lifeAreas.map(area => ({
    area,
    vision_3_5_year: (formData.get(`${area}-vision_3_5_year`) as string) || '',
    vision_10_year: (formData.get(`${area}-vision_10_year`) as string) || '',
  }));
}
