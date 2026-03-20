// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { parseVisionFormData } from '../logic';

describe('parseVisionFormData', () => {
  it('extracts vision fields for each life area', () => {
    const areas = ['Karier/Bisnis', 'Kesehatan & Kebugaran'];
    const formData = new FormData();
    formData.append('Karier/Bisnis-vision_3_5_year', 'CEO');
    formData.append('Karier/Bisnis-vision_10_year', 'Entrepreneur');
    formData.append('Kesehatan & Kebugaran-vision_3_5_year', 'Fit');
    formData.append('Kesehatan & Kebugaran-vision_10_year', 'Healthy');
    const result = parseVisionFormData(formData, areas);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ area: 'Karier/Bisnis', vision_3_5_year: 'CEO', vision_10_year: 'Entrepreneur' });
    expect(result[1]).toEqual({ area: 'Kesehatan & Kebugaran', vision_3_5_year: 'Fit', vision_10_year: 'Healthy' });
  });

  it('returns empty string for missing fields', () => {
    const formData = new FormData();
    const result = parseVisionFormData(formData, ['Karier/Bisnis']);
    expect(result[0].vision_3_5_year).toBe('');
    expect(result[0].vision_10_year).toBe('');
  });
});
