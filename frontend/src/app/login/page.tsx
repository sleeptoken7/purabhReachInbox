"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Header from "@/components/Header";
import ComposeModal from "@/components/ComposeModal";
// ... rest of your code
import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="p-8 bg-white shadow-xl rounded-2xl w-96 text-center border border-gray-100">
        <h1 className="text-2xl font-bold mb-2 text-blue-600">purabhReachInbox</h1>
        <p className="text-gray-500 mb-8 text-sm">Sign in to manage your campaigns</p>
        
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="flex items-center justify-center w-full gap-3 px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium shadow-sm"
        >
          <img src="https://www.svgrepo.com/show/355037/google.svg" className="w-5 h-5" alt="Google" />
          Continue with Google
        </button>
      </div>
    </div>
  );
}