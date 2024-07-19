"use client";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState, useRef, useEffect } from "react";

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
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

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

  const onDragStart = (index: number, e: React.DragEvent) => {
    setDragIndex(index);
    // Hide the default drag image
    const dragImage = document.createElement("div");
    e.dataTransfer.setDragImage(dragImage, 0, 0);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    setHoverIndex(index);
  };

  const onDrop = () => {
    if (dragIndex !== null && hoverIndex !== null) {
      const updated = [...bulletPoints];
      const [draggedItem] = updated.splice(dragIndex, 1);
      updated.splice(hoverIndex, 0, draggedItem);
      setBulletPoints(updated);
    }
    setDragIndex(null);
    setHoverIndex(null);
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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-black">To-Do List</h1>
      {bulletPoints.map((bulletPoint, index) => (
        <div
          key={index}
          draggable
          onDragStart={(e) => onDragStart(index, e)}
          onDragOver={(e) => onDragOver(e, index)}
          onDrop={onDrop}
          className={`mb-2 ml-1.5 flex items-start transition-opacity duration-200 ${
            dragIndex === index ? "bg-gray-300" : "bg-transparent"
          }`}
          style={{
            borderTop: hoverIndex === index ? "2px solid blue" : "none",
          }}
        >
          <div
            className="mr-2"
            style={{ marginLeft: `${bulletPoint.indent * 20}px` }}
          >
            •
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
      ))}
      <div className="flex py-2">
        <FontAwesomeIcon
          icon={faPlus}
          className="hover:bg-gray-300 rounded-full w-3 h-3 p-1 pt-1.5 cursor-pointer"
          onClick={() => addBulletPoint(bulletPoints.length - 1)}
        />
      </div>
    </div>
  );
};

export default BulletPointInput;
