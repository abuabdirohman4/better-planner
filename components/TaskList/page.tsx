"use client";
import { Task } from "@/types";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import TaskItem from "../TaskItem/page";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

const TaskList = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<string>("");
  const taskRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusNext, setFocusNext] = useState<boolean>(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    if (focusNext && taskRefs.current[tasks.length - 1]) {
      const newTaskIndex = tasks.length - 1;
      taskRefs.current[newTaskIndex]?.focus();
      setFocusNext(false);

      // Trigger the Arrow Down event
      const event = new KeyboardEvent("keydown", { key: "ArrowDown" });
      taskRefs.current[newTaskIndex]?.dispatchEvent(event);
    }
  }, [focusNext, tasks]);

  const fetchTasks = async () => {
    const response = await axios.get("/api/tasks");
    setTasks(response.data);
  };

  const addTask = async () => {
    const response = await axios.post("/api/tasks", {
      title: newTask,
      dueDate: new Date(),
      userId: 1,
      index: tasks.length,
    }); // Gantilah userId sesuai dengan logika Anda
    setTasks([...tasks, response.data]);
    setNewTask("");
    setFocusNext(true); // Set focusNext to true
  };

  const handleDelete = async (taskId: number, index: number) => {
    await axios.delete(`/api/tasks/${taskId}`);
    fetchTasks();
    if (index > 0) {
      taskRefs.current[index - 1]?.focus();
    }
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
          onDelete={() => handleDelete(task.id, index)}
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
        <div className="ml-0.5 py-2 flex">
          <FontAwesomeIcon
            icon={faPlus}
            className="hover:bg-gray-300 rounded-full w-3 h-3 p-1 pt-1.5"
            onClick={addTask}
          />
        </div>
      </div>
    </DndProvider>
  );
};

export default TaskList;
