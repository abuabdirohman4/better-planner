"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { Task } from "@/types";
import TaskItem from "../TaskItem/page3";

const TaskList = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<string>("");

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const response = await axios.get("/api/tasks");
    setTasks(response.data);
  };

  const addTask = async () => {
    if (newTask.trim() === "") return;
    const response = await axios.post("/api/tasks", {
      title: newTask,
      dueDate: new Date(),
      userId: 1,
    });
    setTasks([...tasks, response.data]);
    setNewTask("");
  };

  const handleDelete = async (taskId: number) => {
    await axios.delete(`/api/tasks/${taskId}`);
    setTasks(tasks.filter((task) => task.id !== taskId));
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">To-Do List</h1>
      <div className="mb-4">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          className="border p-2 mr-2 w-full mb-2"
          placeholder="Add a new task..."
        />
        <button onClick={addTask} className="bg-blue-500 text-white p-2 w-full">
          Add Task
        </button>
      </div>
      <div>
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onUpdate={fetchTasks}
            onDelete={() => handleDelete(task.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default TaskList;
