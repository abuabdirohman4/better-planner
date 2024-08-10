"use client";
import { fetchHighFocusGoals } from "@/app/api/high-focus-goals/controller";
import TaskItem from "@/components/Tasks/item";
import { Task } from "@/types";
import { SESSIONKEY } from "@/utils/constants";
import { getSession } from "@/utils/session";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

export default function TwelveWeekGoals() {
  const [taks, setTasks] = useState<Task[]>(Array(10).fill({}));
  const inputRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  const fetchDataHighFocusGoal = async ({
    periodName,
  }: {
    periodName: string;
  }) => {
    const res = await fetchHighFocusGoals({ periodName });
    if (res.status == 200) {
      console.log("res.data", res.data);
      const fetchedData = res.data;
      const combinedData = [
        ...fetchedData,
        ...Array(10 - fetchedData.length).fill({}),
      ];
      setTasks(combinedData);
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
          {taks.map((task, index) => (
            <div key={index}>
              <TaskItem
                key={task.id}
                task={task}
                index={index}
                inputRefs={inputRefs}
                orderType="alphabet"
                moveTask={() => {}}
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
