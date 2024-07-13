"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { Task } from "@/types";

const TaskList = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<string>("");

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const response = await axios.get("/api/tasks");
    console.log("response.data", response.data);
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

  const toggleComplete = async (task: Task) => {
    const response = await axios.put(`/api/tasks/${task.id}`, {
      ...task,
      completed: !task.completed,
    });
    setTasks(tasks.map((t) => (t.id === task.id ? response.data : t)));
  };

  const deleteTask = async (taskId: number) => {
    await axios.delete(`/api/tasks/${taskId}`);
    setTasks(tasks.filter((t) => t.id !== taskId));
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">To-Do List</h1>
      <div className="mb-4">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          className="border p-2 mr-2"
        />
        <button onClick={addTask} className="bg-blue-500 text-white p-2">
          Add Task
        </button>
      </div>
      <ul>
        {tasks.map((task) => (
          <li key={task.id} className="flex justify-between items-center mb-2">
            <span className={`flex-1 ${task.completed ? "line-through" : ""}`}>
              {task.title}
            </span>
            <button
              onClick={() => toggleComplete(task)}
              className="bg-green-500 text-white p-2 mr-2"
            >
              {task.completed ? "Undo" : "Complete"}
            </button>
            <button
              onClick={() => deleteTask(task.id)}
              className="bg-red-500 text-white p-2"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TaskList;
