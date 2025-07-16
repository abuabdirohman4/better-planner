"use client";
import { useQuarter } from "@/hooks/common/useQuarter";
import { getQuarterDates } from "@/lib/quarterUtils";

export default function QuarterUsageExample() {
  const quarterData = useQuarter();
  const { startDate: quarterStartDate, endDate: quarterEndDate } = getQuarterDates(quarterData.year, quarterData.quarter);

  // Helper function to format date with day name
  const formatDateWithDay = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

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
            <span className="text-sm">{formatDateWithDay(quarterStartDate)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-medium">End Date:</span>
            <span className="text-sm">{formatDateWithDay(quarterEndDate)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-medium">Current Quarter:</span>
            <span className={quarterData.isCurrentQuarter ? "text-green-600" : "text-gray-500"}>
              {quarterData.isCurrentQuarter ? "Yes" : "No"}
            </span>
          </div>
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              📅 Corrected Date Logic
            </h3>
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              • <strong>Start Date:</strong> Always Monday of the first week of the quarter<br/>
              • <strong>End Date:</strong> Always Sunday of the last week of the quarter<br/>
              • <strong>Week Range:</strong> Based on 13-week quarters (Q1: Week 1-13, Q2: Week 14-26, etc.)
            </p>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded">
          <h3 className="font-semibold mb-2">How to Use:</h3>
          <pre className="text-sm text-gray-600 dark:text-gray-400 overflow-auto">
{`// In your page component:
import { useQuarter } from "@/hooks/common/useQuarter";

export default function MyPage() {
  const quarterData = useQuarter();
  
  return (
    <div>
      <h1>Planning for {quarterData.quarterString}</h1>
      <p>Week range: {quarterData.weekRange}</p>
      <p>From: {quarterData.startDate.toLocaleDateString()}</p>
      <p>To: {quarterData.endDate.toLocaleDateString()}</p>
    </div>
  );
}`}
          </pre>
        </div>
      </div>
    </div>
  );
} 