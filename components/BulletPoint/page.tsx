"use client";
import React, { useState, useRef, useEffect } from "react";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

interface BulletPoint {
  text: string;
  indent: number;
}

const BulletPointInput: React.FC = () => {
  const [bulletPoints, setBulletPoints] = useState<BulletPoint[]>([
    { text: "", indent: 0 },
  ]);
  const activeInputIndex = useRef<number | null>(null);
  const inputRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const cursorPosition = useRef<number | null>(null);

  const addBulletPoint = (index: number) => {
    const newBulletPoints = [...bulletPoints];
    newBulletPoints.splice(index + 1, 0, {
      text: "",
      indent: bulletPoints[index].indent,
    });
    setBulletPoints(newBulletPoints);
    activeInputIndex.current = index + 1;
  };

  const handleInputChange = (index: number, value: string) => {
    cursorPosition.current = inputRefs.current[index]?.selectionStart || null;
    const newBulletPoints = [...bulletPoints];
    newBulletPoints[index].text = value;
    setBulletPoints(newBulletPoints);
    activeInputIndex.current = index;
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addBulletPoint(index);
    } else if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      if (
        bulletPoints[index].indent <
        (bulletPoints[index - 1]?.indent ?? 0) + 1
      ) {
        changeIndent(index, bulletPoints[index].indent + 1);
      }
    } else if (e.key === "Tab" && e.shiftKey) {
      e.preventDefault();
      if (bulletPoints[index].indent > 0) {
        changeIndent(index, bulletPoints[index].indent - 1);
      }
    }
  };

  const changeIndent = (index: number, newIndent: number) => {
    cursorPosition.current = inputRefs.current[index]?.selectionStart || null;
    const newBulletPoints = [...bulletPoints];
    newBulletPoints[index].indent = newIndent;
    setBulletPoints(newBulletPoints);
    activeInputIndex.current = index;
  };

  const moveBulletPoint = (dragIndex: number, hoverIndex: number) => {
    cursorPosition.current =
      inputRefs.current[dragIndex]?.selectionStart || null;
    const dragBulletPoint = bulletPoints[dragIndex];
    const newBulletPoints = [...bulletPoints];
    newBulletPoints.splice(dragIndex, 1);
    newBulletPoints.splice(hoverIndex, 0, dragBulletPoint);
    setBulletPoints(newBulletPoints);
    activeInputIndex.current = hoverIndex;
  };

  const BulletPointItem: React.FC<{
    bulletPoint: BulletPoint;
    index: number;
    moveBulletPoint: (dragIndex: number, hoverIndex: number) => void;
  }> = ({ bulletPoint, index, moveBulletPoint }) => {
    const ref = useRef<HTMLDivElement | null>(null);
    const [, drop] = useDrop({
      accept: "bulletPoint",
      hover: (item: { index: number }) => {
        if (item.index !== index) {
          moveBulletPoint(item.index, index);
          item.index = index;
        }
      },
    });

    const [{ isDragging }, drag] = useDrag({
      type: "bulletPoint",
      item: { index },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });

    drag(drop(ref));

    return (
      <div
        ref={ref}
        className={`mb-2 flex items-start ${isDragging ? "opacity-50" : ""}`}
      >
        <span
          className="mr-2"
          style={{ marginLeft: `${bulletPoint.indent * 20}px` }}
        >
          •
        </span>
        <textarea
          ref={(el) => (inputRefs.current[index] = el)}
          placeholder="Add new task"
          value={bulletPoint.text}
          onChange={(e) => handleInputChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          rows={1}
          className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    );
  };

  useEffect(() => {
    if (activeInputIndex.current !== null) {
      const input = inputRefs.current[activeInputIndex.current];
      if (input) {
        input.focus();
        if (cursorPosition.current !== null) {
          input.setSelectionRange(
            cursorPosition.current,
            cursorPosition.current
          );
        }
      }
    }
  }, [bulletPoints]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-4">
        <button
          onClick={() => addBulletPoint(bulletPoints.length - 1)}
          className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          +
        </button>
        {bulletPoints.map((bulletPoint, index) => (
          <BulletPointItem
            key={index}
            bulletPoint={bulletPoint}
            index={index}
            moveBulletPoint={moveBulletPoint}
          />
        ))}
      </div>
    </DndProvider>
  );
};

export default BulletPointInput;
