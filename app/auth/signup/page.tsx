"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ChevronDown } from "lucide-react";
import GoogleSignInButton from "@/components/GoogleSignInButton";

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
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [year, setYear] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillsLevel, setSkillsLevel] = useState<{ [skill: string]: string }>({});
  const [interests, setInterests] = useState<string[]>([]);
  const [goals, setGoals] = useState("");
  const [availability, setAvailability] = useState<string[]>([]);
  const [interaction, setInteraction] = useState("");
  // Mentor-specific
  const [location, setLocation] = useState("");
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [resume, setResume] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const storage = getStorage();

  // Handle URL parameter for starting at specific step
  useEffect(() => {
    const stepParam = searchParams?.get('step');
    const nameParam = searchParams?.get('name');
    const emailParam = searchParams?.get('email');
    const profilePicUrlParam = searchParams?.get('profilePicUrl');
    
    if (stepParam) {
      const stepNumber = parseInt(stepParam);
      if (stepNumber >= 1 && stepNumber <= 6) {
        setStep(stepNumber);
      }
    }
    
    // Pre-fill data from Google authentication
    if (nameParam) setName(nameParam);
    if (emailParam) setEmail(emailParam);
    if (profilePicUrlParam) {
      // For Google users, we'll use their profile pic URL
      // This will be handled in the signup process
    }
  }, [searchParams]);

  const totalSteps = role === "mentor" ? 6 : 5;

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
      // Validate required fields
      if (!name || !email || !password) {
        throw new Error("Please fill in all required fields");
      }
      
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
      
      // 3. Save user profile in Firestore with ALL collected data
      const userData = {
        uid: user.uid,
        email,
        name,
        role,
        age: age || "",
        location: location || "",
        linkedin: linkedin || "",
        skills: skills || [],
        interests: interests || [],
        goals: goals || "",
        availability: availability || [],
        interaction: interaction || "",
        profilePicUrl: profilePicUrl || "",
        resumeUrl: resumeUrl || "",
        status: role === "mentor" ? "pending_review" : "active",
        createdAt: new Date().toISOString(),
      };
      
      console.log("Saving user data:", userData); // Debug log
      
      await setDoc(doc(db, "users", user.uid), userData);
      
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: any) {
      console.error("Signup error:", err); // Debug log
      setError(err.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: colorBg }} className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-full max-w-lg p-8 bg-white rounded shadow">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full"
              style={{
                width: `${(step / totalSteps) * 100}%`,
                background: colorPrimary,
                transition: 'width 0.3s',
              }}
            />
          </div>
          <div className="flex justify-between text-xs mt-2 text-gray-500">
            <span>Start</span>
            <span>Finish</span>
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: colorAccent }}>
          {step === 1 ? "New here? We're here for the mess." : step === totalSteps ? "Review & Submit" : "Let's get to know you"}
        </h2>
        <form onSubmit={handleSignup} className="space-y-6">
          {/* Step 1: Google/email */}
          {step === 1 && (
            <div>
              <div className="mb-6">
                <GoogleSignInButton />
                <div className="my-4 text-center text-gray-400 text-xs">or sign up with email</div>
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 border rounded" placeholder="What should we call you? (Nicknames welcome)" />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-3 py-2 border rounded" placeholder="you@procrastinators.club" />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="w-full px-3 py-2 border rounded" placeholder="Make it strong-ish" />
              </div>
              <button type="button" onClick={() => setStep(2)} disabled={!name || !email || !password} className="w-full py-2 rounded font-semibold" style={{ background: colorPrimary, color: "white" }}>Next</button>
            </div>
          )}
          {/* Step 2: Role selection */}
          {step === 2 && (
            <div>
              <label className="block mb-2 font-medium">Who are you today?</label>
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
                    <span className="text-xs text-gray-500">{r.value === "mentor" ? "Mentors: For the wise, the patient, and the caffeine-fueled." : r.value === "buddy" ? "Buddies: For the ones who need a partner in crime (or at least in deadlines)." : "Mentees: For the lost, the learning, and the low-key legends."}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-between mt-6">
                <button type="button" onClick={() => setStep(1)} className="px-4 py-2 rounded" style={{ background: colorSecondary, color: "white" }}>Back</button>
                <button type="button" onClick={() => setStep(3)} disabled={!role} className="px-4 py-2 rounded" style={{ background: colorPrimary, color: "white" }}>Next</button>
              </div>
            </div>
          )}
          {/* Step 3: Personal details */}
          {step === 3 && (
            <div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Age or College Year</label>
                <input type="text" value={age} onChange={e => setAge(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="19, 2nd year, or just 'lost'" />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Location</label>
                <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="City, Country, or 'Remote'" />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">LinkedIn (optional)</label>
                <input type="text" value={linkedin} onChange={e => setLinkedin(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="Paste your LinkedIn or leave blank (we won't judge)" />
              </div>
              <div className="flex justify-between">
                <button type="button" onClick={() => setStep(2)} className="px-4 py-2 rounded" style={{ background: colorSecondary, color: "white" }}>Back</button>
                <button type="button" onClick={() => setStep(4)} className="px-4 py-2 rounded" style={{ background: colorPrimary, color: "white" }}>Next</button>
              </div>
            </div>
          )}
          {/* Step 4: Skills, interests, availability, interaction */}
          {step === 4 && (
            <div>
              <MultiSelectDropdown label="Skills" options={SKILLS_LIST} selected={skills} setSelected={setSkills} max={5} />
              <MultiSelectDropdown label="Interests" options={SKILLS_LIST} selected={interests} setSelected={setInterests} max={5} />
              <div className="mb-4">
                <label className="block mb-1 font-medium">Goals</label>
                <input type="text" value={goals} onChange={e => setGoals(e.target.value)} required className="w-full px-3 py-2 border rounded" placeholder="What do you want to achieve? (e.g. 'Survive finals', 'Build a startup', 'World domination')" />
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
              <div className="mb-4">
                <label className="block mb-1 font-medium">Preferred Interaction</label>
                <select value={interaction} onChange={e => setInteraction(e.target.value)} className="w-full px-3 py-2 border rounded">
                  <option value="">Select one</option>
                  <option value="chat">Chat</option>
                  <option value="call">Call</option>
                  <option value="project">Project Collab</option>
                </select>
              </div>
              <div className="flex justify-between">
                <button type="button" onClick={() => setStep(3)} className="px-4 py-2 rounded" style={{ background: colorSecondary, color: "white" }}>Back</button>
                <button type="button" onClick={() => setStep(role === "mentor" ? 5 : 5)} disabled={skills.length === 0 || interests.length === 0 || !goals || availability.length === 0 || !interaction} className="px-4 py-2 rounded" style={{ background: colorPrimary, color: "white" }}>Next</button>
              </div>
            </div>
          )}
          {/* Step 5: Mentor-specific fields */}
          {step === 5 && role === "mentor" && (
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
                <button type="button" onClick={() => setStep(4)} className="px-4 py-2 rounded" style={{ background: colorSecondary, color: "white" }}>Back</button>
                <button type="button" onClick={() => setStep(6)} disabled={loading || !location || !profilePic || !resume} className="px-4 py-2 rounded" style={{ background: colorPrimary, color: "white" }}>Next</button>
              </div>
            </div>
          )}
          {/* Step 5/6: Review & Submit */}
          {((step === 5 && role !== "mentor") || (step === 6 && role === "mentor")) && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Quick Review</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li><b>Name:</b> {name}</li>
                  <li><b>Email:</b> {email}</li>
                  <li><b>Role:</b> {role}</li>
                  <li><b>Age/Year:</b> {age || year}</li>
                  <li><b>Location:</b> {location}</li>
                  <li><b>LinkedIn:</b> {linkedin || "(none)"}</li>
                  <li><b>Skills:</b> {skills.join(", ")}</li>
                  <li><b>Interests:</b> {interests.join(", ")}</li>
                  <li><b>Goals:</b> {goals}</li>
                  <li><b>Availability:</b> {availability.join(", ")}</li>
                  <li><b>Preferred Interaction:</b> {interaction}</li>
                  {role === "mentor" && <>
                    <li><b>Profile Pic:</b> {profilePic ? profilePic.name : "(none)"}</li>
                    <li><b>Resume:</b> {resume ? resume.name : "(none)"}</li>
                  </>}
                </ul>
              </div>
              <div className="flex justify-between">
                <button type="button" onClick={() => setStep(role === "mentor" ? 5 : 4)} className="px-4 py-2 rounded" style={{ background: colorSecondary, color: "white" }}>Back</button>
                <button type="submit" disabled={loading} className="px-4 py-2 rounded" style={{ background: colorPrimary, color: "white" }}>{loading ? "Signing up..." : "Sign Up"}</button>
              </div>
            </div>
          )}
          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
          {success && <div className="text-green-600 text-sm font-semibold mt-2">Signup successful! Redirecting to your new home for questionable life choices...</div>}
        </form>
        <p className="mt-4 text-center text-sm">
          Already have an account? <a href="/auth/signin" className="text-blue-600 hover:underline">Sign In</a>
        </p>
      </div>
    </div>
  );
}
