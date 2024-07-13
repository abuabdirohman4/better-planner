"use client";
import { Task } from "@/types";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import TaskItem from "../TaskItem/page";

const TaskList = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<string>("");
  const taskRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  const handleDelete = async (taskId: number) => {
    await axios.delete(`/api/tasks/${taskId}`);
    fetchTasks();
  };

  const moveTask = (dragIndex: number, hoverIndex: number) => {
    const dragTask = tasks[dragIndex];
    const updatedTasks = [...tasks];
    updatedTasks.splice(dragIndex, 1);
    updatedTasks.splice(hoverIndex, 0, dragTask);

    // Adjust indentLevel based on new position
    updatedTasks.forEach((task, index) => {
      if (index === 0) {
        task.indentLevel = 0;
      } else {
        const previousTask = updatedTasks[index - 1];
        task.indentLevel = Math.min(
          previousTask.indentLevel + 1,
          task.indentLevel
        );
      }
      axios.put(`/api/tasks/${task.id}`, task);
    });

    setTasks(updatedTasks);
  };

  const renderTasks = (tasks: Task[], depth = 0) => {
    return tasks.map((task, index) => {
      const previousTaskIndentLevel =
        index > 0 ? tasks[index - 1].indentLevel : null;
      return (
        <TaskItem
          key={task.id}
          index={index}
          task={task}
          previousTaskIndentLevel={previousTaskIndentLevel}
          moveTask={moveTask}
          onUpdate={fetchTasks}
          onIndent={handleIndent}
          onDelete={() => handleDelete(task.id)}
          inputRef={(el) => (taskRefs.current[index] = el)}
          onKeyDown={(e) => handleKeyDown(e, index)}
        />
      );
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowUp" && index > 0) {
      taskRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowDown" && index < tasks.length - 1) {
      taskRefs.current[index + 1]?.focus();
    } else if (e.key === "Enter") {
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
        <div>{renderTasks(tasks)}</div>
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              addTask();
            }
          }}
          className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
          placeholder="Add a new task..."
        />
      </div>
    </DndProvider>
  );
};

export default TaskList;
