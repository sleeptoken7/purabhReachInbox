"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Header from "@/components/Header";
import ComposeModal from "@/components/ComposeModal";

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [activeTab, setActiveTab] = useState("SCHEDULED");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchJobs = async () => {
    const res = await axios.get("http://localhost:5000/api/emails/jobs");
    setJobs(res.data);
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const filteredJobs = jobs.filter((job: any) => job.status === activeTab);

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-6xl mx-auto mt-8 p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4 border-b w-full">
            <button 
              onClick={() => setActiveTab("SCHEDULED")}
              className={`pb-2 px-4 ${activeTab === "SCHEDULED" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
            >
              Scheduled Emails
            </button>
            <button 
              onClick={() => setActiveTab("SENT")}
              className={`pb-2 px-4 ${activeTab === "SENT" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
            >
              Sent Emails
            </button>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 whitespace-nowrap ml-4"
          >
            Compose New Email
          </button>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-sm font-medium text-gray-500">Recipient</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500">Subject</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500">Time</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-20 text-gray-400">
                    No {activeTab.toLowerCase()} emails found.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job: any) => (
                  <tr key={job.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">{job.recipient}</td>
                    <td className="px-6 py-4">{job.subject}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(job.scheduledAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs ${job.status === 'SENT' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {job.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && <ComposeModal onClose={() => setIsModalOpen(false)} onRefresh={fetchJobs} />}
    </main>
  );
}