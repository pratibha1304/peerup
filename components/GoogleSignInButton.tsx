"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db, GoogleAuthProvider } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { signInWithPopup } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";

export default function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user exists in Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        // Show popup message that email is not registered
        const userConfirmed = window.confirm(
          `This email (${user.email}) is not registered with PeerUp.\n\n` +
          `Would you like to create an account? You'll be redirected to complete your profile.`
        );
        
        if (userConfirmed) {
          // No Firestore profile yet - redirect to onboarding with pre-filled data
          const params = new URLSearchParams({
            step: '2',
            name: user.displayName || '',
            email: user.email || '',
            profilePicUrl: user.photoURL || ''
          });
          router.push(`/auth/signup?${params.toString()}`);
        } else {
          // User cancelled, sign them out
          await signOut(auth);
          setError("Please sign up first or use a registered email address.");
        }
        return;
      } else {
        // Check if user has completed their profile
        const userData = userSnap.data();
        const hasCompleteProfile = userData.role && userData.skills && userData.goals;
        
        if (!hasCompleteProfile) {
          // User exists but profile is incomplete, redirect to onboarding
          const params = new URLSearchParams({
            step: '2',
            name: userData.name || user.displayName || '',
            email: userData.email || user.email || '',
            profilePicUrl: userData.profilePicUrl || user.photoURL || ''
          });
          router.push(`/auth/signup?${params.toString()}`);
        } else {
          // User has complete profile, go to dashboard
          router.push("/dashboard");
        }
      }
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      // Handle specific Firebase auth errors
      if (err.code === 'auth/email-already-in-use' || err.code === 'auth/account-exists-with-different-credential') {
        setError("This email is already registered. Please sign in with your email and password, or use a different Google account.");
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError("Sign-in was cancelled. Please try again.");
      } else {
        setError(err.message || "Google sign-in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <Button
        onClick={handleGoogleSignIn}
        disabled={loading}
        variant="outline"
        className="w-full h-12 flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-foreground border-border hover:border-primary/40 transition-all duration-300 font-medium rounded-xl shadow-sm hover:shadow-md"
      >
        <svg width="20" height="20" viewBox="0 0 48 48" className="inline-block">
          <g>
            <path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C35.64 2.36 30.18 0 24 0 14.82 0 6.71 5.82 2.69 14.09l7.98 6.2C12.13 13.13 17.57 9.5 24 9.5z"/>
            <path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.01l7.19 5.6C43.98 37.13 46.1 31.3 46.1 24.55z"/>
            <path fill="#FBBC05" d="M10.67 28.29A14.5 14.5 0 019.5 24c0-1.49.25-2.93.67-4.29l-7.98-6.2A23.93 23.93 0 000 24c0 3.77.9 7.34 2.69 10.49l7.98-6.2z"/>
            <path fill="#EA4335" d="M24 48c6.18 0 11.36-2.05 15.15-5.57l-7.19-5.6c-2.01 1.35-4.6 2.16-7.96 2.16-6.43 0-11.87-3.63-14.33-8.79l-7.98 6.2C6.71 42.18 14.82 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </g>
        </svg>
        {loading ? "Signing you in..." : "Sign in with Google"}
      </Button>
      {error && (
        <div className="text-destructive text-sm mt-2 text-center">
          {error}
        </div>
      )}
    </div>
  );
}