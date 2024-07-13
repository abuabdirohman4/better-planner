import TaskList from "@/components/TaskList/page";
import TimeTracker from "@/components/TimeTracker/page";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <main className="p-4">
        <TaskList />
        {/* <TimeTracker /> */}
      </main>
    </div>
  );
}
