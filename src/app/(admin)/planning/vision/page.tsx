import type { Metadata } from "next";
import { getVisions } from './actions';
import VisionForm from './VisionForm';

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
    <VisionForm visions={visions} />
  );
} 