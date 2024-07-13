"use client";
import { Task } from "@/types";
import axios from "axios";
import { useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import TaskItem from "../TaskItem/page";

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

  const moveTask = (dragIndex: number, hoverIndex: number) => {
    const dragTask = tasks[dragIndex];
    const updatedTasks = [...tasks];
    updatedTasks.splice(dragIndex, 1);
    updatedTasks.splice(hoverIndex, 0, dragTask);

    setTasks(updatedTasks);

    // Update index in the database
    updatedTasks.forEach((task, index) => {
      task.index = index;
      axios.put(`/api/tasks/${task.id}`, task);
    });
  };

  const renderTasks = (tasks: Task[], depth = 0) => {
    return tasks.map((task, index) => (
      <TaskItem
        key={task.id}
        index={index}
        task={task}
        moveTask={moveTask}
        onUpdate={fetchTasks}
        onAddChild={handleAddChild}
        onIndent={handleIndent}
        onDelete={() => handleDelete(task.id)}
      />
    ));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addTask();
    }
  };

  const handleIndent = (taskId: number, newIndentLevel: number) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, indentLevel: newIndentLevel } : task
    );
    setTasks(updatedTasks);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 text-black">To-Do List</h1>
        {/* <div className="mb-4">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={handleKeyDown}
            className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
            placeholder="Add a new task..."
          />
        </div> */}
        <div>{renderTasks(tasks)}</div>
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={handleKeyDown}
          className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
          placeholder="Add a new task..."
        />
      </div>
    </DndProvider>
  );
};

export default TaskList;
