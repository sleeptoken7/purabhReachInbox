"use client";
import React, { useState } from "react";
import axios from "axios";
import Papa from "papaparse";

export default function ComposeModal({ onClose, onRefresh }: any) {
  const [recipients, setRecipients] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [startTime, setStartTime] = useState("");
  const [delay, setDelay] = useState(2);
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      complete: (results) => {
        const emails = results.data
          .flat()
          .map((e: any) => e?.toString().trim())
          .filter((email: string) => email && email.includes("@"));
        setRecipients(emails);
      },
    });
  };

  const handleSubmit = async () => {
    try {
      if (recipients.length === 0) return alert("Please upload a CSV with leads.");
      if (!subject || !body || !startTime) return alert("Please fill in all fields.");

      setLoading(true);

      // TIMEZONE FIX: Convert local picker time to absolute UTC ISO string
      const formattedStartTime = new Date(startTime).toISOString();

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://purabhreachinbox.onrender.com/api/emails";
      
      const response = await axios.post(`${baseUrl}/schedule`, {
        recipients,
        subject,
        body,
        startTime: formattedStartTime,
        delayBetweenEmails: delay,
        hourlyLimit: limit,
      });

      if (response.status === 201 || response.status === 200) {
        alert("Campaign Scheduled Successfully!");
        onRefresh();
        onClose();
      }
    } catch (error: any) {
      console.error("Submit Error:", error);
      alert(`Error: ${error.response?.data?.message || "Failed to schedule"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-8 shadow-2xl border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Compose New Outreach</h2>
        
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Leads (CSV)</label>
            <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            <p className="text-xs text-blue-600 mt-2 font-medium">{recipients.length} email addresses detected</p>
          </div>

          <input placeholder="Email Subject" className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" onChange={(e) => setSubject(e.target.value)} />
          
          <textarea placeholder="Write your message here... (HTML supported)" className="w-full border border-gray-200 p-3 rounded-xl h-40 focus:ring-2 focus:ring-blue-500 outline-none transition resize-none" onChange={(e) => setBody(e.target.value)} />

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Start Time</label>
              <input type="datetime-local" className="w-full border border-gray-200 p-2 rounded-lg text-sm" onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Delay (sec)</label>
              <input type="number" value={delay} className="w-full border border-gray-200 p-2 rounded-lg text-sm" onChange={(e) => setDelay(Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hourly Limit</label>
              <input type="number" value={limit} className="w-full border border-gray-200 p-2 rounded-lg text-sm" onChange={(e) => setLimit(Number(e.target.value))} />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button onClick={onClose} className="px-6 py-2.5 text-gray-500 font-medium hover:text-gray-700 transition">Cancel</button>
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className={`bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition transform active:scale-95 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? "Scheduling..." : "Schedule Campaign"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
