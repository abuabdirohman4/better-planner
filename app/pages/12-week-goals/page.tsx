"use client";
import { fetchHighFocusGoal } from "@/app/api/high-focus-goal/controller";
import { Task } from "@/types";
import { SESSIONKEY } from "@/utils/constants";
import { getSession } from "@/utils/session";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import BulletPointItem from "../high-focus-goal/item";

export default function TwelveWeekGoals() {
  const [bulletPoints, setBulletPoints] = useState<Task[]>(Array(10).fill({}));
  const inputRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  const fetchDataHighFocusGoal = async ({
    periodName,
  }: {
    periodName: string;
  }) => {
    const res = await fetchHighFocusGoal({ periodName });
    if (res.status == 200) {
      console.log("res.data", res.data);
      const fetchedData = res.data;
      const combinedData = [
        ...fetchedData,
        ...Array(10 - fetchedData.length).fill({}),
      ];
      setBulletPoints(combinedData);
    }
  };

  useEffect(() => {
    const periodActive = getSession(SESSIONKEY.periodActive);
    fetchDataHighFocusGoal({ periodName: periodActive });
  }, []);
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="container mx-auto p-4">
        {/* HEADER */}
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-black">12 WEEK GOAL</h1>
          <div className="flex justify-center mt-2">
            <Image
              width={150}
              height={150}
              src="/title.svg"
              alt="title"
              priority
            />
          </div>
        </div>
        <div className="mb-4">
          <div>MULAI : </div>
          <div>AKHIR : </div>
        </div>

        {/* CONTENT */}
        <ul>
          {bulletPoints.map((bulletPoint, index) => (
            <div key={index}>
              <BulletPointItem
                key={bulletPoint.id}
                bulletPoint={bulletPoint}
                index={index}
                inputRefs={inputRefs}
                orderType="alphabet"
                moveBulletPoint={() => {}}
                handleInputChange={() => {}}
                handleKeyDown={() => {}}
                setHoverIndex={() => {}}
                setDragIndex={() => {}}
              />
            </div>
          ))}
        </ul>
      </div>
    </DndProvider>
  );
}
