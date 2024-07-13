"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { Task } from "@/types";
import TaskItem from "../TaskItem/page";

const TaskList = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<string>("");
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

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
    }); // Gantilah userId sesuai dengan logika Anda
    setTasks([...tasks, response.data]);
    setNewTask("");
  };

  const handleAddChild = async (parentId: number, title: string) => {
    const response = await axios.post("/api/tasks", {
      title,
      dueDate: new Date(),
      userId: 1,
      parentId,
    }); // Gantilah userId sesuai dengan logika Anda
    fetchTasks();
  };

  const handleDelete = async (taskId: number) => {
    await axios.delete(`/api/tasks/${taskId}`);
    fetchTasks();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addTask();
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">To-Do List</h1>
      <div className="mb-4">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={handleKeyDown}
          // className="border p-2 mr-2 w-full mb-2"
          className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
          placeholder="Add a new task..."
        />
        {/* <button onClick={addTask} className="bg-blue-500 text-white p-2 w-full">
          Add Task
        </button> */}
      </div>
      <div className="relative z-0 w-full mb-5 group">
        <input
          type="email"
          name="floating_email"
          id="floating_email"
          className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
          placeholder=" "
          required
        />
      </div>
      <div>
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onUpdate={fetchTasks}
            onAddChild={handleAddChild}
            onDelete={() => handleDelete(task.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default TaskList;
