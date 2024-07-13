"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { Task } from "@/types";

const TimeTracker = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(() => {
      if (startTime) {
        setElapsedTime((new Date().getTime() - startTime.getTime()) / 1000);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const fetchTasks = async () => {
    const response = await axios.get("/api/tasks");
    setTasks(response.data);
  };

  const startTask = (task: Task) => {
    setActiveTask(task);
    setStartTime(new Date());
  };

  const stopTask = async () => {
    if (activeTask && startTime) {
      const endTime = new Date();
      await axios.post("/api/timelogs", {
        taskId: activeTask.id,
        startTime,
        endTime,
      });
      setActiveTask(null);
      setStartTime(null);
      setElapsedTime(0);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Time Tracker</h1>
      <ul>
        {tasks.map((task) => (
          <li key={task.id} className="flex justify-between items-center mb-2">
            <span className="flex-1">{task.title}</span>
            {activeTask?.id === task.id ? (
              <button onClick={stopTask} className="bg-red-500 text-white p-2">
                Stop
              </button>
            ) : (
              <button
                onClick={() => startTask(task)}
                className="bg-blue-500 text-white p-2"
              >
                Start
              </button>
            )}
          </li>
        ))}
      </ul>
      {activeTask && (
        <div className="mt-4">
          <h2 className="text-xl font-bold">Active Task: {activeTask.title}</h2>
          <p>
            Elapsed Time: {Math.floor(elapsedTime / 60)} minutes{" "}
            {Math.floor(elapsedTime % 60)} seconds
          </p>
        </div>
      )}
    </div>
  );
};

export default TimeTracker;
