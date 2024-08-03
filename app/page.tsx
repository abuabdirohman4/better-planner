"use client";
import { useEffect } from "react";
import { createPeriod, fetchPeriod } from "./api/period/controller";

export default function Home() {
  useEffect(() => {
    const fetchData = async () => {
      const res = await fetchPeriod({ quarter: 1 });
      console.log("res get", res);
    };
    fetchData();

    const handleSubmit = async () => {
      const res = await createPeriod({ year: 2024 });
      console.log("res post", res);
    };
    handleSubmit();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="p-4">
        <h1 className="text-4xl mb-8">Period</h1>
      </main>
    </div>
  );
}
