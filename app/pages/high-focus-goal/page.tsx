"use client";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState, useRef, useEffect } from "react";
import { useDrag, useDrop, DndProvider, DragPreviewImage } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

interface BulletPoint {
  id?: number;
  text: string;
  indent: number;
}

export default function HighFocusGoal() {
  const [bulletPoints, setBulletPoints] = useState<BulletPoint[]>([]);
  const inputRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const activeInputIndex = useRef<number | null>(null);
  const cursorPosition = useRef<number | null>(null);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchBulletPoints();
  }, []);

  const fetchBulletPoints = async () => {
    const response = await fetch("/api/bulletPoints");
    const data = await response.json();
    setBulletPoints(data);
  };

  const addBulletPoint = async (index: number) => {
    const newIndent = index >= 0 ? bulletPoints[index].indent : 0;
    const newBulletPoint = { text: "", indent: newIndent };
    const response = await fetch("/api/bulletPoints", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newBulletPoint),
    });
    const data = await response.json();
    const updatedBulletPoints = [
      ...bulletPoints.slice(0, index + 1),
      data,
      ...bulletPoints.slice(index + 1),
    ];
    setBulletPoints(updatedBulletPoints);
    activeInputIndex.current = index + 1;
  };

  const handleInputChange = async (index: number, value: string) => {
    cursorPosition.current = inputRefs.current[index]?.selectionStart || null;
    const newBulletPoints = [...bulletPoints];
    newBulletPoints[index].text = value;
    setBulletPoints(newBulletPoints);
    console.log("newBulletPoints", newBulletPoints);

    const taskId = newBulletPoints[index].id;
    if (newBulletPoints[index].id) {
      await fetch(`/api/bulletPoints/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newBulletPoints[index]),
      });
    }

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

  const changeIndent = async (index: number, newIndent: number) => {
    cursorPosition.current = inputRefs.current[index]?.selectionStart || null;
    const newBulletPoints = [...bulletPoints];
    newBulletPoints[index].indent = newIndent;
    setBulletPoints(newBulletPoints);

    const taskId = newBulletPoints[index].id;
    if (newBulletPoints[index].id) {
      await fetch(`/api/bulletPoints/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newBulletPoints[index]),
      });
    }

    activeInputIndex.current = index;
  };

  const moveBulletPoint = (dragIndex: number, hoverIndex: number) => {
    const dragBulletPoint = bulletPoints[dragIndex];
    const newBulletPoints = [...bulletPoints];
    newBulletPoints.splice(dragIndex, 1);
    newBulletPoints.splice(hoverIndex, 0, dragBulletPoint);
    setBulletPoints(newBulletPoints);
    activeInputIndex.current = hoverIndex;
    setDragIndex(null);
    setHoverIndex(null);
  };

  const BulletPointItem = ({
    bulletPoint,
    index,
    moveBulletPoint,
  }: {
    bulletPoint: BulletPoint;
    index: number;
    moveBulletPoint: (dragIndex: number, hoverIndex: number) => void;
  }) => {
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
    }, [isDragging, index]);

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
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 text-black">High Focus Goal</h1>
        {bulletPoints.map((bulletPoint, index) => (
          <BulletPointItem
            key={bulletPoint.id}
            bulletPoint={bulletPoint}
            index={index}
            moveBulletPoint={moveBulletPoint}
          />
        ))}
        <div className="flex py-2">
          <FontAwesomeIcon
            icon={faPlus}
            className="hover:bg-gray-300 rounded-full w-3 h-3 p-1 pt-1.5"
            onClick={() => addBulletPoint(bulletPoints.length - 1)}
          />
        </div>
      </div>
    </DndProvider>
  );
}
