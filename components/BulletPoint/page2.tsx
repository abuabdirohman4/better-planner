"use client";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

const BulletPointInput: React.FC = () => {
  const [bulletPoints, setBulletPoints] = useState<string[]>([""]);

  const addBulletPoint = () => {
    setBulletPoints([...bulletPoints, ""]);
  };

  const handleInputChange = (index: number, value: string) => {
    const newBulletPoints = [...bulletPoints];
    newBulletPoints[index] = value;
    setBulletPoints(newBulletPoints);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addBulletPoint();
    } else if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      handleInputChange(
        index,
        bulletPoints[index].substring(0, start) +
          "\t" +
          bulletPoints[index].substring(end)
      );
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      }, 0);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-black">To-Do List</h1>
      {bulletPoints.map((bullet, index) => (
        <div key={index} className="mb-2 ml-1.5 flex items-start items-center">
          <div className={`relative group cursor-pointer bg-white`}>
            <div className="w-2 h-2 bg-black rounded-full"></div>
            <div
              className={`absolute -left-1.5 -top-1.5 inset-0 w-5 h-5 rounded-full border-[6px] border-transparent group-hover:border-gray-300 transition-all duration-300 ease-in-out`}
            ></div>
          </div>
          <textarea
            value={bullet}
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
          className="hover:bg-gray-300 rounded-full w-3 h-3 p-1 pt-1.5"
          onClick={addBulletPoint}
        />
      </div>
    </div>
  );
};

export default BulletPointInput;
