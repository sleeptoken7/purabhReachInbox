"use client";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Header from "../components/Header";
import ComposeModal from "../components/ComposeModal";
import { LayoutDashboard, Send, Clock, LogOut, Plus } from "lucide-react";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [activeTab, setActiveTab] = useState("SCHEDULED");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const fetchJobs = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://purabhreachinbox.onrender.com/api/emails";
      const res = await axios.get(`${apiUrl}/jobs`);
      setJobs(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchJobs();
      const interval = setInterval(fetchJobs, 5000);
      return () => clearInterval(interval);
    }
  }, [status]);

  if (status === "loading") return <div className="flex items-center justify-center min-h-screen font-sans">Loading purabhReachInbox...</div>;
  if (!session) return null;

  const filteredJobs = jobs.filter((job: any) => job.status === activeTab);

  return (
    <div className="flex min-h-screen bg-[#F4F6F8] font-sans text-[#172B4D]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-blue-600">ReachInbox</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab("SCHEDULED")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === "SCHEDULED" ? "bg-blue-50 text-blue-600 font-semibold" : "hover:bg-gray-50 text-gray-600"}`}>
            <Clock size={20} /> Scheduled
          </button>
          <button onClick={() => setActiveTab("SENT")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === "SENT" ? "bg-blue-50 text-blue-600 font-semibold" : "hover:bg-gray-50 text-gray-600"}`}>
            <Send size={20} /> Sent Emails
          </button>
        </nav>
        <div className="p-4 border-t">
          <button onClick={() => signOut()} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-lg transition">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <h2 className="text-lg font-semibold">{activeTab === "SCHEDULED" ? "Upcoming Campaigns" : "Sent History"}</h2>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-5 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700 shadow-sm transition">
              <Plus size={18} /> Compose New
            </button>
            <img src={session.user?.image || ""} className="w-8 h-8 rounded-full border" alt="User" />
          </div>
        </header>

        <div className="p-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Recipient</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Subject</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Time</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredJobs.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-20 text-gray-400">No emails found in this section.</td></tr>
                ) : (
                  filteredJobs.map((job: any) => (
                    <tr key={job.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-medium text-gray-900">{job.recipient}</td>
                      <td className="px-6 py-4 text-gray-600">{job.subject}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(job.scheduledAt).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${job.status === 'SENT' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
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
      </main>
      {isModalOpen && <ComposeModal onClose={() => setIsModalOpen(false)} onRefresh={fetchJobs} />}
    </div>
  );
}
