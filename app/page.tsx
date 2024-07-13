import TaskList from "@/components/TaskList/page";
import TimeTracker from "@/components/TimeTracker/page";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-500 text-white p-4 text-center">
        <h1 className="text-3xl">To-Do List with Time Tracker</h1>
      </header>
      <main className="p-4">
        <TaskList />
        <TimeTracker />
      </main>
    </div>
  );
}
