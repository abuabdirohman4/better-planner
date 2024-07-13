"use client";
import { useState } from "react";
import axios from "axios";
import { Task } from "@/types";

interface TaskItemProps {
  task: Task;
  onUpdate: () => void;
  onDelete: () => void;
}

const TaskItem = ({ task, onUpdate, onDelete }: TaskItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");

  const handleSave = async () => {
    await axios.put(`/api/tasks/${task.id}`, { ...task, title, description });
    setIsEditing(false);
    onUpdate();
  };

  return (
    <div className="flex items-center justify-between mb-2 p-2 border rounded hover:bg-gray-100">
      <div className="flex-1">
        {isEditing ? (
          <>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border p-1 mb-1"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border p-1 mb-1"
            />
          </>
        ) : (
          <>
            <h3 className={`text-lg ${task.completed ? "line-through" : ""}`}>
              {task.title}
            </h3>
            <p>{task.description}</p>
          </>
        )}
      </div>
      <div className="flex items-center space-x-2">
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
      </div>
    </div>
  );
};

export default TaskItem;
