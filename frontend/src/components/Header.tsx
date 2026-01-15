"use client";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="flex items-center justify-between px-8 py-4 bg-white border-b">
      <h1 className="text-xl font-bold text-blue-600">purabhReachInbox</h1>
      
      {session?.user && (
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium">{session.user.name}</p>
            <p className="text-xs text-gray-500">{session.user.email}</p>
          </div>
          <img 
            src={session.user.image || ""} 
            alt="Avatar" 
            className="w-10 h-10 rounded-full border"
          />
          <button 
            onClick={() => signOut()}
            className="text-sm text-red-500 hover:underline"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
}