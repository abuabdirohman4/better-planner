import { Task } from "@/types";
import React, { useEffect, useRef } from "react";
import { DragPreviewImage, useDrag, useDrop } from "react-dnd";

interface TaskItemProps {
  task: Task;
  index: number;
  inputRefs: React.MutableRefObject<(HTMLTextAreaElement | null)[]>;
  orderType?: "bullet" | "number" | "alphabet";
  moveTask: (dragIndex: number, hoverIndex: number) => void;
  handleInputChange: (index: number, value: string) => void;
  handleKeyDown: (e: React.KeyboardEvent, index: number) => void;
  setHoverIndex: React.Dispatch<React.SetStateAction<number | null>>;
  hoverIndex?: number | null;
  setDragIndex: React.Dispatch<React.SetStateAction<number | null>>;
  dragIndex?: number | null;
}

const TaskItem = ({
  task,
  index,
  inputRefs,
  orderType = "bullet",
  moveTask,
  handleInputChange,
  handleKeyDown,
  setHoverIndex,
  hoverIndex,
  setDragIndex,
  dragIndex,
}: TaskItemProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [, drop] = useDrop({
    accept: "task",
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        if (hoverIndex !== index) {
          setHoverIndex(index);
        }
      } else {
        if (hoverIndex !== null) {
          setHoverIndex(null);
        }
      }
    },
    drop: (item: { index: number }) => {
      if (item.index !== index) {
        moveTask(item.index, index);
      }
      setHoverIndex(null);
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: "task",
    item: { index },
    previewOptions: {
      offsetX: 0,
      offsetY: 0,
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: () => {
      setDragIndex(null);
    },
  });

  useEffect(() => {
    if (isDragging) {
      setDragIndex(index);
      document.body.style.cursor = "move";
    } else {
      document.body.removeAttribute("style");
    }
  }, [isDragging, index, setDragIndex]);

  drag(drop(ref));

  return (
    <>
      <DragPreviewImage connect={preview} src="/bullet.svg" />
      {hoverIndex === index && (
        <div className="border-t-2 border-blue-500 my-1"></div>
      )}
      <div
        ref={ref}
        className={`mb-2 ml-1.5 flex items-start items-center cursor-pointer ${
          dragIndex === index ? "bg-gray-300" : "bg-transparent"
        } ${isDragging ? "opacity-0" : "opacity-100"} 
        `}
      >
        <div
          className={`relative group`}
          style={{ marginLeft: `${task.indent * 20}px` }}
        >
          {orderType === "bullet" ? (
            <>
              <div className="w-2 h-2 bg-black rounded-full"></div>
              <div
                className={`absolute -left-1.5 -top-1.5 inset-0 w-5 h-5 rounded-full border-[6px] border-transparent group-hover:border-primary group-hover:bg-white transition-all duration-300 ease-in-out`}
              ></div>
            </>
          ) : (
            <div className="w-8 text-center flex-shrink-0 rounded-lg border bg-primary text-white border-white hover:bg-white hover:text-primary hover:border-primary transition-all duration-300 ease-in-out">
              {orderType === "alphabet"
                ? String.fromCharCode(65 + index)
                : orderType === "number" && index + 1}
              .
            </div>
          )}
        </div>
        <textarea
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          placeholder="Add new task"
          value={task.name}
          onChange={(e) => handleInputChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          rows={1}
          className="block pl-3 w-full text-gray-900 bg-transparent resize-none appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
        />
      </div>
    </>
  );
};

export default TaskItem;
