"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Header from "../components/Header";
import ComposeModal from "../components/ComposeModal";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [activeTab, setActiveTab] = useState("SCHEDULED");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // REDIRECT LOGIC: If not logged in, go to login page
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchJobs = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://purabhreachinbox.onrender.com/api/emails";
      const res = await axios.get(`${apiUrl}/jobs`);
      setJobs(res.data);
    } catch (err) {
      console.error("Failed to fetch jobs", err);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchJobs();
      const interval = setInterval(fetchJobs, 5000);
      return () => clearInterval(interval);
    }
  }, [status]);

  if (status === "loading") return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!session) return null;

  const filteredJobs = jobs.filter((job: any) => job.status === activeTab);

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <Header />
      <div className="max-w-6xl mx-auto mt-8 p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4 border-b w-full">
            <button onClick={() => setActiveTab("SCHEDULED")} className={`pb-2 px-4 ${activeTab === "SCHEDULED" ? "border-b-2 border-blue-600 text-blue-600 font-bold" : "text-gray-500"}`}>Scheduled</button>
            <button onClick={() => setActiveTab("SENT")} className={`pb-2 px-4 ${activeTab === "SENT" ? "border-b-2 border-blue-600 text-blue-600 font-bold" : "text-gray-500"}`}>Sent</button>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-6 py-2 rounded-lg ml-4 shadow-md">Compose New Email</button>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Recipient</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Subject</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Time</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-20 text-gray-400">No emails found.</td></tr>
              ) : (
                filteredJobs.map((job: any) => (
                  <tr key={job.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{job.recipient}</td>
                    <td className="px-6 py-4 text-gray-600">{job.subject}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(job.scheduledAt).toLocaleString()}</td>
                    <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${job.status === 'SENT' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{job.status}</span></td>
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