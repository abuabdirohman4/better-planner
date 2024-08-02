import { BulletPoint } from "@/types";
import React, { useRef, useEffect } from "react";
import { useDrag, useDrop, DragPreviewImage } from "react-dnd";

interface BulletPointItemProps {
  bulletPoint: BulletPoint;
  index: number;
  moveBulletPoint: (dragIndex: number, hoverIndex: number) => void;
  inputRefs: React.MutableRefObject<(HTMLTextAreaElement | null)[]>;
  handleInputChange: (index: number, value: string) => void;
  handleKeyDown: (e: React.KeyboardEvent, index: number) => void;
  setHoverIndex: React.Dispatch<React.SetStateAction<number | null>>;
  hoverIndex: number | null;
  setDragIndex: React.Dispatch<React.SetStateAction<number | null>>;
  dragIndex: number | null;
}

const BulletPointItem = ({
  bulletPoint,
  index,
  moveBulletPoint,
  inputRefs,
  handleInputChange,
  handleKeyDown,
  setHoverIndex,
  hoverIndex,
  setDragIndex,
  dragIndex,
}: BulletPointItemProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [, drop] = useDrop({
    accept: "bulletPoint",
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
        moveBulletPoint(item.index, index);
      }
      setHoverIndex(null);
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: "bulletPoint",
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
          className={`relative group bg-white `}
          style={{ marginLeft: `${bulletPoint.indent * 20}px` }}
        >
          <div className="w-2 h-2 bg-black rounded-full"></div>
          <div
            className={`absolute -left-1.5 -top-1.5 inset-0 w-5 h-5 rounded-full border-[6px] border-transparent group-hover:border-gray-300 transition-all duration-300 ease-in-out`}
          ></div>
        </div>
        <textarea
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          placeholder="Add new task"
          value={bulletPoint.text}
          onChange={(e) => handleInputChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          rows={1}
          className="block pl-3 w-full text-gray-900 bg-transparent resize-none appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
        />
      </div>
    </>
  );
};

export default BulletPointItem;
