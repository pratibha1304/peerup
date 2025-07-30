"use client";
import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function TestPage() {
  const [backendStatus, setBackendStatus] = useState("");
  const [matchTest, setMatchTest] = useState("");
  const [loading, setLoading] = useState(false);

  const testBackend = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/test");
      const data = await res.json();
      setBackendStatus(`✅ Backend is running: ${data.message}`);
    } catch (error) {
      setBackendStatus(`❌ Backend error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testMatching = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        setMatchTest("❌ No user logged in");
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        setMatchTest("❌ User profile not found");
        return;
      }

      const userProfile = userDoc.data();
      console.log("Testing with profile:", userProfile);

      const res = await fetch("http://localhost:3000/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userProfile }),
      });

      const data = await res.json();
      console.log("Match test response:", data);
      
      if (data.error) {
        setMatchTest(`❌ Match error: ${data.error}`);
      } else {
        setMatchTest(`✅ Found ${data.matches?.length || 0} matches`);
      }
    } catch (error) {
      setMatchTest(`❌ Match test error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Backend Test Page</h1>
      
      <div className="space-y-6">
        <div className="bg-white dark:bg-[#23272f] rounded-xl p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">Backend Status</h2>
          <button
            onClick={testBackend}
            disabled={loading}
            className="px-4 py-2 bg-[#85BCB1] text-white rounded-lg hover:bg-[#645990] transition disabled:opacity-50"
          >
            {loading ? "Testing..." : "Test Backend"}
          </button>
          {backendStatus && (
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded">
              {backendStatus}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-[#23272f] rounded-xl p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">Matching Test</h2>
          <button
            onClick={testMatching}
            disabled={loading}
            className="px-4 py-2 bg-[#645990] text-white rounded-lg hover:bg-[#2C6485] transition disabled:opacity-50"
          >
            {loading ? "Testing..." : "Test Matching"}
          </button>
          {matchTest && (
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded">
              {matchTest}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 