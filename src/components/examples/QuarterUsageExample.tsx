"use client";
import { useQuarter } from "@/hooks/useQuarter";

export default function QuarterUsageExample() {
  const quarterData = useQuarter();

  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Quarter Data Example</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">Quarter:</span>
            <span className="text-brand-600 dark:text-brand-400">
              {quarterData.quarterString}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-medium">Week Range:</span>
            <span>{quarterData.weekRange}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-medium">Start Date:</span>
            <span>{quarterData.startDate.toLocaleDateString()}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-medium">End Date:</span>
            <span>{quarterData.endDate.toLocaleDateString()}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-medium">Current Quarter:</span>
            <span className={quarterData.isCurrentQuarter ? "text-green-600" : "text-gray-500"}>
              {quarterData.isCurrentQuarter ? "Yes" : "No"}
            </span>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded">
          <h3 className="font-semibold mb-2">How to Use:</h3>
          <pre className="text-sm text-gray-600 dark:text-gray-400 overflow-auto">
{`// In your page component:
import { useQuarter } from "@/hooks/useQuarter";

export default function MyPage() {
    const quarterData = useQuarter();

    return (
        <div>
        <h1>Planning for {quarterData.quarterString}</h1>
        <p>Week range: {quarterData.weekRange}</p>
        </div>
    );
}`}
          </pre>
        </div>
      </div>
    </div>
  );
} 