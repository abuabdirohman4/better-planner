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
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");

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
    await axios.put(`/api/tasks/${task.id}`, { ...task, title, description });
    setIsEditing(false);
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
        task.indentLevel <= previousTaskIndentLevel
      ) {
        const newIndentLevel = task.indentLevel + 1;
        await axios.put(`/api/tasks/${task.id}`, {
          ...task,
          indentLevel: newIndentLevel,
        });
        onIndent(task.id, newIndentLevel);
      }
    } else if (e.key === "Tab" && e.shiftKey) {
      e.preventDefault();
      if (task.indentLevel > 0) {
        const newIndentLevel = task.indentLevel - 1;
        await axios.put(`/api/tasks/${task.id}`, {
          ...task,
          indentLevel: newIndentLevel,
        });
        onIndent(task.id, newIndentLevel);
      }
    } else if ((e.key === "Backspace" || e.key === "Delete") && title.trim() === "") {
      e.preventDefault();
      onDelete();
    }
  };

  return (
    <div
      className={`flex items-center justify-between p-2 ${
        isDragging ? "bg-gray-300" : ""
      }`}
      style={{ marginLeft: task.indentLevel * 20 }}
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
        className="block pl-3 w-full text-gray-900 bg-transparent appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
      />
      {/* <div className="flex items-center space-x-2">
        {isEditing ? (
          <button
            onClick={handleSave}
            className="bg-green-500 text-white p-1 rounded"
          >
            Save
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-500 text-white p-1 rounded"
          >
            Edit
          </button>
        )}
        <button
          onClick={onDelete}
          className="bg-red-500 text-white p-1 rounded"
        >
          Delete
        </button>
      </div> */}
    </div>
  );
};

export default TaskItem;
