import React from "react";
import { getMovies, getSchedule } from "@/lib/db";
import DashboardClient from "@/components/admin/DashboardClient";

function getLocalDateString(date: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  
  const now = new Date();
  const todayStr = getLocalDateString(now);
  
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = getLocalDateString(tomorrow);

  const selectedDate = date === tomorrowStr ? tomorrowStr : todayStr;

  const movies = await getMovies();
  const schedule = await getSchedule(selectedDate);

  return (
    <div className="max-w-4xl mx-auto">
      <DashboardClient 
        movies={movies} 
        schedule={schedule} 
        selectedDate={selectedDate}
        todayStr={todayStr}
        tomorrowStr={tomorrowStr}
      />
    </div>
  );
}
