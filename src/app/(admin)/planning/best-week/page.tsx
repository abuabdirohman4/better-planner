import React from 'react';
import BestWeekClient from './BestWeekClient';

export default function BestWeekPage() {
  return (
    <div className="mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Best Week</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 italic">
          &quot;Tujuan dibuat jadwal itu bukan untuk dijalani secara strict 100%, tapi untuk merancang aktivitas yang terarah dimana penerapannya bisa terus kita EVALUASI secara berkala.&quot;
        </p>
      </div>
      <BestWeekClient />
    </div>
  );
}
