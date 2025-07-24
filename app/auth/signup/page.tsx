"use client";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ChevronDown } from "lucide-react";

const ROLES = [
  { value: "mentor", label: "Mentor", desc: "Guide others, share your expertise, and help mentees achieve their goals." },
  { value: "buddy", label: "Buddy", desc: "Find study partners, collaborate, and stay motivated together." },
  { value: "mentee", label: "Mentee", desc: "Learn from mentors, set goals, and track your progress." },
];

const SKILLS_LIST = [
  "javascript", "python", "java", "c++", "react", "node.js", "express", "mongodb", "sql", "typescript", "html", "css", "ui/ux", "design", "marketing", "business", "data science", "machine learning", "ai", "cloud", "aws", "azure", "gcp", "devops", "docker", "kubernetes", "git", "figma", "photoshop", "illustrator", "writing", "public speaking", "photography", "music", "finance", "accounting", "product management", "project management", "leadership", "teamwork", "problem solving", "critical thinking", "communication", "sales", "content creation", "seo", "social media", "video editing", "animation", "cybersecurity", "blockchain", "solidity", "flutter", "android", "ios", "swift", "kotlin", "go", "ruby", "php", "laravel", "django", "flask", "r", "matlab", "statistics", "research", "biology", "chemistry", "physics", "mathematics", "economics", "psychology", "education", "teaching", "coaching", "mentoring", "sports", "fitness", "yoga", "meditation", "health", "nutrition", "cooking", "baking", "languages", "french", "spanish", "german", "hindi", "chinese", "japanese", "korean", "arabic", "travel", "gaming", "esports", "volunteering", "sustainability", "environment", "robotics", "electronics", "hardware", "networking", "testing", "qa", "customer support", "hr", "recruitment", "legal", "law", "medicine", "nursing", "veterinary", "architecture", "interior design", "fashion", "event planning", "journalism", "blogging", "podcasting", "comedy", "acting", "film", "theatre", "dance", "painting", "sculpture", "calligraphy", "crafts", "diy", "gardening", "parenting", "pets", "astrology", "spirituality", "philosophy", "history", "politics", "international relations"
];

const AVAILABILITY_OPTIONS = [
  "Mornings", "Afternoons", "Evenings", "Nights", "Weekdays", "Weekends"
];

const colorPrimary = "#85BCB1";
const colorAccent = "#2C6485";
const colorBg = "#D3E9D3";
const colorSecondary = "#645990";

function MultiSelectDropdown({ label, options, selected, setSelected, max }: { label: string, options: string[], selected: string[], setSelected: (a: string[]) => void, max: number }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleSelect = (value: string) => {
    if (selected.includes(value)) return;
    if (selected.length < max) {
      setSelected([...selected, value]);
      setOpen(false);
    }
  };
  const handleRemove = (value: string) => setSelected(selected.filter((v) => v !== value));

  return (
    <div className="mb-4">
      <label className="block mb-1 font-medium">{label}</label>
      <div className="relative" ref={dropdownRef}>
        <div className="flex flex-wrap gap-2 mb-2">
          {selected.map((item) => (
            <span key={item} className="flex items-center bg-[#85BCB1] text-white px-2 py-1 rounded-full text-xs">
              {item}
              <button type="button" className="ml-1 text-white" onClick={() => handleRemove(item)}>&times;</button>
            </span>
          ))}
        </div>
        <button type="button" className="w-full px-3 py-2 border rounded flex items-center justify-between" style={{ borderColor: colorPrimary }} onClick={() => setOpen((o) => !o)}>
          <span>{selected.length > 0 ? `Add more (${max - selected.length} left)` : `Select ${label.toLowerCase()}`}</span>
          <ChevronDown className="h-4 w-4" />
        </button>
        {open && (
          <div className="absolute z-10 bg-white border rounded w-full max-h-48 overflow-y-auto mt-1 shadow">
            {options.filter((opt) => !selected.includes(opt)).map((option) => (
              <button
                type="button"
                key={option}
                className="block w-full text-left px-3 py-1 hover:bg-gray-100"
                onClick={() => handleSelect(option)}
                disabled={selected.length >= max}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [goals, setGoals] = useState("");
  const [availability, setAvailability] = useState<string[]>([]);
  // Mentor-specific
  const [location, setLocation] = useState("");
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [resume, setResume] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const storage = getStorage();

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  const toggleMultiSelect = (value: string, arr: string[], setArr: (a: string[]) => void, max: number) => {
    if (arr.includes(value)) {
      setArr(arr.filter((v) => v !== value));
    } else if (arr.length < max) {
      setArr([...arr, value]);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      // 1. Create user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: name });
      // 2. Upload files if mentor
      let profilePicUrl = "";
      let resumeUrl = "";
      if (role === "mentor") {
        if (profilePic) {
          const picRef = ref(storage, `profilePics/${user.uid}`);
          await uploadBytes(picRef, profilePic);
          profilePicUrl = await getDownloadURL(picRef);
        }
        if (resume) {
          const resumeRef = ref(storage, `resumes/${user.uid}`);
          await uploadBytes(resumeRef, resume);
          resumeUrl = await getDownloadURL(resumeRef);
        }
      }
      // 3. Save user profile in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email,
        name,
        role,
        skills,
        interests,
        goals,
        availability,
        location: role === "mentor" ? location : "",
        profilePicUrl,
        resumeUrl,
        status: role === "mentor" ? "pending_review" : "active",
        createdAt: new Date().toISOString(),
      });
      setSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: colorBg }} className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-full max-w-lg p-8 bg-white rounded shadow">
        <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: colorAccent }}>Sign Up</h2>
        <form onSubmit={handleSignup} className="space-y-6">
          {step === 1 && (
            <div>
              <label className="block mb-2 font-medium">Select your role:</label>
              <div className="flex flex-col gap-3">
                {ROLES.map((r) => (
                  <label key={r.value} className={`flex items-center p-3 border rounded cursor-pointer ${role === r.value ? "border-"+colorAccent+" bg-"+colorPrimary+"/10" : "border-gray-200"}`}>
                    <input
                      type="radio"
                      name="role"
                      value={r.value}
                      checked={role === r.value}
                      onChange={() => setRole(r.value)}
                      required
                      className="mr-3"
                    />
                    <span className="font-semibold mr-2">{r.label}</span>
                    <span className="text-xs text-gray-500">{r.desc}</span>
                  </label>
                ))}
              </div>
              <button type="button" onClick={handleNext} disabled={!role} className="mt-6 w-full py-2 rounded font-semibold" style={{ background: colorPrimary, color: "white" }}>Next</button>
            </div>
          )}
          {step === 2 && (
            <div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 border rounded" placeholder="Your Name" />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-3 py-2 border rounded" placeholder="you@example.com" />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="w-full px-3 py-2 border rounded" placeholder="Password" />
              </div>
              <div className="flex justify-between">
                <button type="button" onClick={handleBack} className="px-4 py-2 rounded" style={{ background: colorSecondary, color: "white" }}>Back</button>
                <button type="button" onClick={handleNext} disabled={!name || !email || !password} className="px-4 py-2 rounded" style={{ background: colorPrimary, color: "white" }}>Next</button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div>
              <MultiSelectDropdown label="Skills" options={SKILLS_LIST} selected={skills} setSelected={setSkills} max={5} />
              <MultiSelectDropdown label="Interests" options={SKILLS_LIST} selected={interests} setSelected={setInterests} max={5} />
              <div className="mb-4">
                <label className="block mb-1 font-medium">Goals</label>
                <input type="text" value={goals} onChange={e => setGoals(e.target.value)} required className="w-full px-3 py-2 border rounded" placeholder="What do you want to achieve?" />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Availability</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABILITY_OPTIONS.map((option) => (
                    <button
                      type="button"
                      key={option}
                      className={`px-4 py-2 rounded-full border ${availability.includes(option) ? "bg-"+colorPrimary+" text-white border-"+colorAccent : "bg-gray-100 border-gray-300"}`}
                      onClick={() => toggleMultiSelect(option, availability, setAvailability, AVAILABILITY_OPTIONS.length)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-between">
                <button type="button" onClick={handleBack} className="px-4 py-2 rounded" style={{ background: colorSecondary, color: "white" }}>Back</button>
                <button type="button" onClick={handleNext} disabled={skills.length === 0 || interests.length === 0 || !goals || availability.length === 0} className="px-4 py-2 rounded" style={{ background: colorPrimary, color: "white" }}>Next</button>
              </div>
            </div>
          )}
          {step === 4 && role === "mentor" && (
            <div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Location</label>
                <input type="text" value={location} onChange={e => setLocation(e.target.value)} required className="w-full px-3 py-2 border rounded" placeholder="Your City, Country" />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Profile Picture (.jpg, .png)</label>
                <input type="file" accept="image/*" onChange={e => setProfilePic(e.target.files?.[0] || null)} required className="w-full" />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Resume (.pdf, .jpg)</label>
                <input type="file" accept=".pdf,.jpg,.jpeg" onChange={e => setResume(e.target.files?.[0] || null)} required className="w-full" />
              </div>
              <div className="flex justify-between">
                <button type="button" onClick={handleBack} className="px-4 py-2 rounded" style={{ background: colorSecondary, color: "white" }}>Back</button>
                <button type="submit" disabled={loading || !location || !profilePic || !resume} className="px-4 py-2 rounded" style={{ background: colorPrimary, color: "white" }}>{loading ? "Signing up..." : "Sign Up"}</button>
              </div>
            </div>
          )}
          {((step === 4 && role !== "mentor") || (step === 5 && role === "mentor")) && (
            <div>
              <div className="flex justify-between">
                <button type="button" onClick={handleBack} className="px-4 py-2 rounded" style={{ background: colorSecondary, color: "white" }}>Back</button>
                <button type="submit" disabled={loading} className="px-4 py-2 rounded" style={{ background: colorPrimary, color: "white" }}>{loading ? "Signing up..." : "Sign Up"}</button>
              </div>
            </div>
          )}
          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
          {success && <div className="text-green-600 text-sm font-semibold mt-2">Signup successful! Redirecting...</div>}
        </form>
        <p className="mt-4 text-center text-sm">
          Already have an account? <a href="/auth/signin" className="text-blue-600 hover:underline">Sign In</a>
        </p>
      </div>
    </div>
  );
}
