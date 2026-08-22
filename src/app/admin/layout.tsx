import React from "react";
import "../globals.css"; // Ensure admin gets global styles

export const metadata = {
  title: "Admin | Sree Lekha Theatre",
  robots: "noindex, nofollow", // Keep admin out of search engines
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 py-4 px-6 shadow-sm">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight">
            Sree Lekha Theatre <span className="text-gray-400 font-normal">Admin</span>
          </h1>
          {/* Logout button can be client side or a form action, we will put it in dashboard */}
        </div>
      </header>
      <main className="p-6">
        {children}
      </main>
    </div>
  );
}
