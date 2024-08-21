"use client";
import { fetchHighFocusGoals } from "@/app/api/high-focus-goals/controller";
import Tasks from "@/components/Tasks/page";
import { HighFocusGoal } from "@/types";
import { SESSIONKEY } from "@/utils/constants";
import { getSession } from "@/utils/session";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function TwelveWeekGoals() {
  const [tasks, setTasks] = useState<HighFocusGoal[]>(Array(10).fill({}));

  const fetchDataHighFocusGoal = async ({
    periodName,
  }: {
    periodName: string;
  }) => {
    const res = await fetchHighFocusGoals({ periodName });
    if (res.status == 200) {
      const fetchedData = res.data.map((task: HighFocusGoal) => ({
        id: task.id,
        clientId: task.clientId,
        motivation: task.name,
        name: task.name,
        order: task.StatusHighFocusGoal && task.StatusHighFocusGoal[0].order,
        priority:
          task.StatusHighFocusGoal && task.StatusHighFocusGoal[0].priority,
        point: task.StatusHighFocusGoal && task.StatusHighFocusGoal[0].point,
        completed:
          task.StatusHighFocusGoal && task.StatusHighFocusGoal[0].completed,
        StatusHighFocusGoal: task.StatusHighFocusGoal,
      }));
      const combinedData = [
        ...fetchedData,
        ...Array(10 - fetchedData.length).fill({}),
      ];
      combinedData.sort(
        (a: HighFocusGoal, b: HighFocusGoal) => Number(a.order) - Number(b.order)
      );
      setTasks(combinedData);
    }
  };

  useEffect(() => {
    const periodActive = getSession(SESSIONKEY.periodActive);
    fetchDataHighFocusGoal({ periodName: periodActive });
  }, []);
  return (
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
      <Tasks
        type="12WG"
        sourceTasks={tasks}
        endpoint="high-focus-goals"
        allowIndent={false}
        orderType="alphabet"
      />
    </div>
  );
}
