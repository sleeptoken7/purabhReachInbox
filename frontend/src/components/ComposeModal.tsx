"use client";
import { useState } from "react";
import axios from "axios";
import Papa from "papaparse";

export default function ComposeModal({ onClose, onRefresh }: any) {
  const [recipients, setRecipients] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [startTime, setStartTime] = useState("");
  const [delay, setDelay] = useState(2);
  const [limit, setLimit] = useState(50);

  const handleFileUpload = (e: any) => {
    const file = e.target.files[0];
    Papa.parse(file, {
      complete: (results) => {
        const emails = results.data.flat().filter((email: any) => email.includes("@"));
        setRecipients(emails as string[]);
      },
    });
  };

  const handleSubmit = async () => {
    await axios.post("http://localhost:5000/api/emails/schedule", {
      recipients,
      subject,
      body,
      startTime,
      delayBetweenEmails: delay,
      hourlyLimit: limit,
    });
    onRefresh();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Compose New Outreach</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Upload Leads (CSV)</label>
            <input type="file" onChange={handleFileUpload} className="w-full border p-2 rounded" />
            <p className="text-xs text-gray-500 mt-1">{recipients.length} emails detected</p>
          </div>

          <input 
            placeholder="Subject" 
            className="w-full border p-3 rounded-lg" 
            onChange={(e) => setSubject(e.target.value)}
          />
          
          <textarea 
            placeholder="Email Body (HTML supported)" 
            className="w-full border p-3 rounded-lg h-32" 
            onChange={(e) => setBody(e.target.value)}
          />

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs mb-1">Start Time</label>
              <input type="datetime-local" className="w-full border p-2 rounded" onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs mb-1">Delay (sec)</label>
              <input type="number" value={delay} className="w-full border p-2 rounded" onChange={(e) => setDelay(Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-xs mb-1">Hourly Limit</label>
              <input type="number" value={limit} className="w-full border p-2 rounded" onChange={(e) => setLimit(Number(e.target.value))} />
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-8">
            <button onClick={onClose} className="px-6 py-2 text-gray-500">Cancel</button>
            <button 
              onClick={handleSubmit}
              className="bg-blue-600 text-white px-8 py-2 rounded-lg hover:bg-blue-700"
            >
              Schedule Campaign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}