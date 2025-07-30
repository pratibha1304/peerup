"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default function SigninPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: '#D3E9D3' }}>
      <div className="w-full max-w-md p-8 bg-white rounded shadow">
        <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: '#2C6485' }}>Already panicking daily? Log in.</h2>
        <div className="mb-6">
          <GoogleSignInButton />
          <div className="my-4 text-center text-gray-400 text-xs">or sign in with email</div>
        </div>
        <form onSubmit={handleSignin} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded"
              placeholder="you@procrastinators.club"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded"
              placeholder="Hopefully you remember this one"
            />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm font-semibold">Sign in successful! Redirecting to your not-so-average dashboard...</div>}
          <button
            type="submit"
            className="w-full bg-[#85BCB1] text-black py-2 rounded font-semibold hover:bg-[#85BCB1]/90 transition disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          Don&apos;t have an account? <a href="/auth/signup" className="text-blue-600 hover:underline">Sign Up</a>
        </p>
      </div>
    </div>
  );
}
