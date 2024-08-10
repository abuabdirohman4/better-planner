"use client";
import { Task } from "@/types";
import axios from "axios";
import { useRef, useState } from "react";
import { useDrag, useDrop } from "react-dnd";

const ItemType = "TASK";

interface TaskItemProps {
  task: Task;
  index: number;
  previousTaskIndentLevel: number | null;
  moveTask: (dragIndex: number, hoverIndex: number) => void;
  onUpdate: () => void;
  onDelete: () => void;
  onIndent: (taskId: number, newIndentLevel: number) => void;
  inputRef: (el: HTMLInputElement | null) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

const TaskItem = ({
  task,
  index,
  previousTaskIndentLevel,
  moveTask,
  onUpdate,
  onIndent,
  onDelete,
  inputRef,
  onKeyDown,
}: TaskItemProps) => {
  const [title, setTitle] = useState(task.name);
  const [isFocused, setIsFocused] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

  const [, drop] = useDrop({
    accept: ItemType,
    hover(item: { index: number }) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      moveTask(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  const handleSave = async () => {
    await axios.put(`/api/tasks/${task.id}`, { ...task, title });
    onUpdate();
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    onKeyDown(e);
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      if (
        previousTaskIndentLevel !== null &&
        task.id &&
        task.indent &&
        task.indent <= previousTaskIndentLevel
      ) {
        const newIndentLevel = task.indent + 1;
        await axios.put(`/api/tasks/${task.id}`, {
          ...task,
          indentLevel: newIndentLevel,
        });
        onIndent(task.id, newIndentLevel);
      }
    } else if (e.key === "Tab" && e.shiftKey) {
      e.preventDefault();
      if (task.id && task.indent && task.indent > 0) {
        const newIndentLevel = task.indent - 1;
        await axios.put(`/api/tasks/${task.id}`, {
          ...task,
          indentLevel: newIndentLevel,
        });
        onIndent(task.id, newIndentLevel);
      }
    } else if (
      (e.key === "Backspace" || e.key === "Delete") &&
      title.trim() === ""
    ) {
      e.preventDefault();
      onDelete();
    }
  };

  return (
    <div
      className={`flex items-center justify-between p-2 ${
        isDragging ? "bg-gray-300" : ""
      }`}
      style={{ marginLeft: task.indent && task.indent * 20 }}
    >
      <div className={`relative group cursor-pointer bg-white`} ref={ref}>
        <div className="w-2 h-2 bg-black rounded-full"></div>
        <div
          className={`absolute -left-1.5 -top-1.5 inset-0 w-5 h-5 rounded-full border-[6px] border-transparent group-hover:border-gray-300 transition-all duration-300 ease-in-out`}
        ></div>
      </div>
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="block pl-3 w-full text-gray-900 bg-transparent appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
        placeholder={`${isFocused ? "Add a new task..." : ""}`}
      />
    </div>
  );
};

export default TaskItem;
