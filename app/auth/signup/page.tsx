"use client";
import React, { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ChevronDown, ArrowLeft, Sparkles, User, Target, FileText, CheckCircle } from "lucide-react";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

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
    <div className="space-y-2">
      <Label className="text-foreground font-medium">{label}</Label>
      <div className="relative" ref={dropdownRef}>
        <div className="flex flex-wrap gap-2 mb-3">
          {selected.map((item) => (
            <Badge key={item} variant="secondary" className="bg-primary/20 text-primary border-primary/30">
              {item}
              <button type="button" className="ml-2 text-primary hover:text-primary/80" onClick={() => handleRemove(item)}>&times;</button>
            </Badge>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 justify-between border-primary/20 focus:border-primary transition-colors"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="text-muted-foreground">
            {selected.length > 0 ? `Add more (${max - selected.length} left)` : `Select ${label.toLowerCase()}`}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
        {open && (
          <div className="absolute z-10 bg-card border border-primary/20 rounded-xl w-full max-h-48 overflow-y-auto mt-1 shadow-xl">
            {options.filter((opt) => !selected.includes(opt)).map((option) => (
              <button
                type="button"
                key={option}
                className="block w-full text-left px-4 py-3 hover:bg-primary/10 transition-colors"
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

function SignupForm() {
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

  const getStepIcon = (stepNumber: number) => {
    switch (stepNumber) {
      case 1: return <User className="w-5 h-5" />;
      case 2: return <Target className="w-5 h-5" />;
      case 3: case 4: case 5: case 6: return <FileText className="w-5 h-5" />;
      default: return <CheckCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Home</span>
          </Link>
          <ThemeToggle />
        </div>

        <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-card/80 backdrop-blur-sm">
          <CardContent className="p-8">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-heading font-bold text-foreground">
                  {step === 1 ? "Join PeerUP" : step === totalSteps ? "Almost Done!" : "Tell us more"}
                </h1>
                <div className="flex items-center space-x-2">
                  {getStepIcon(step)}
                  <span className="text-sm text-muted-foreground">Step {step} of {totalSteps}</span>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                  style={{
                    width: `${(step / totalSteps) * 100}%`,
                  }}
                />
              </div>
            </div>

            <form onSubmit={handleSignup} className="space-y-6">
              {/* Step 1: Google/email */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-xl font-heading font-bold text-foreground mb-2">Welcome to PeerUP!</h2>
                    <p className="text-muted-foreground">Let's get you started on your journey</p>
                  </div>

                  <div className="mb-6">
                    <GoogleSignInButton />
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-muted-foreground/20"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-card text-muted-foreground">or continue with email</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-foreground font-medium">Full Name</Label>
                      <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                        className="h-12 rounded-xl border-primary/20 focus:border-primary transition-colors"
                        placeholder="What should we call you?"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-foreground font-medium">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        className="h-12 rounded-xl border-primary/20 focus:border-primary transition-colors"
                        placeholder="you@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="h-12 rounded-xl border-primary/20 focus:border-primary transition-colors"
                        placeholder="Create a strong password"
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!name || !email || !password}
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                  >
                    Continue
                  </Button>
                </div>
              )}

              {/* Step 2: Role selection */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-heading font-bold text-foreground mb-2">Choose Your Role</h2>
                    <p className="text-muted-foreground">What brings you to PeerUP today?</p>
                  </div>

                  <div className="space-y-4">
                    {ROLES.map((r) => (
                      <label key={r.value} className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                        role === r.value 
                          ? "border-primary bg-primary/10 shadow-lg" 
                          : "border-muted-foreground/20 hover:border-primary/40"
                      }`}>
                        <input
                          type="radio"
                          name="role"
                          value={r.value}
                          checked={role === r.value}
                          onChange={() => setRole(r.value)}
                          required
                          className="mr-4 mt-1"
                        />
                        <div className="flex-1">
                          <div className="font-heading font-semibold text-foreground mb-1">{r.label}</div>
                          <div className="text-sm text-muted-foreground">{r.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="px-6 h-12 rounded-xl border-primary/20 text-primary hover:bg-primary/10"
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setStep(3)}
                      disabled={!role}
                      className="px-6 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Personal details */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-heading font-bold text-foreground mb-2">Tell us about yourself</h2>
                    <p className="text-muted-foreground">Help us match you with the right people</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="age" className="text-foreground font-medium">Age or College Year</Label>
                      <Input
                        id="age"
                        type="text"
                        value={age}
                        onChange={e => setAge(e.target.value)}
                        className="h-12 rounded-xl border-primary/20 focus:border-primary transition-colors"
                        placeholder="e.g., 19, 2nd year, or just 'lost'"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-foreground font-medium">Location</Label>
                      <Input
                        id="location"
                        type="text"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        className="h-12 rounded-xl border-primary/20 focus:border-primary transition-colors"
                        placeholder="City, Country, or 'Remote'"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkedin" className="text-foreground font-medium">LinkedIn (optional)</Label>
                      <Input
                        id="linkedin"
                        type="text"
                        value={linkedin}
                        onChange={e => setLinkedin(e.target.value)}
                        className="h-12 rounded-xl border-primary/20 focus:border-primary transition-colors"
                        placeholder="Paste your LinkedIn URL"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(2)}
                      className="px-6 h-12 rounded-xl border-primary/20 text-primary hover:bg-primary/10"
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setStep(4)}
                      className="px-6 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Skills, interests, availability, interaction */}
              {step === 4 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-heading font-bold text-foreground mb-2">Skills & Interests</h2>
                    <p className="text-muted-foreground">What are you passionate about?</p>
                  </div>

                  <div className="space-y-6">
                    <MultiSelectDropdown label="Skills" options={SKILLS_LIST} selected={skills} setSelected={setSkills} max={5} />
                    <MultiSelectDropdown label="Interests" options={SKILLS_LIST} selected={interests} setSelected={setInterests} max={5} />
                    
                    <div className="space-y-2">
                      <Label htmlFor="goals" className="text-foreground font-medium">Goals</Label>
                      <Input
                        id="goals"
                        type="text"
                        value={goals}
                        onChange={e => setGoals(e.target.value)}
                        required
                        className="h-12 rounded-xl border-primary/20 focus:border-primary transition-colors"
                        placeholder="What do you want to achieve?"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground font-medium">Availability</Label>
                      <div className="flex flex-wrap gap-2">
                        {AVAILABILITY_OPTIONS.map((option) => (
                          <Button
                            type="button"
                            key={option}
                            variant={availability.includes(option) ? "default" : "outline"}
                            className={`rounded-full ${
                              availability.includes(option) 
                                ? "bg-primary text-primary-foreground" 
                                : "border-primary/20 text-foreground hover:border-primary/40"
                            }`}
                            onClick={() => toggleMultiSelect(option, availability, setAvailability, AVAILABILITY_OPTIONS.length)}
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="interaction" className="text-foreground font-medium">Preferred Interaction</Label>
                      <select 
                        value={interaction} 
                        onChange={e => setInteraction(e.target.value)} 
                        className="w-full h-12 px-4 rounded-xl border border-primary/20 focus:border-primary transition-colors bg-background text-foreground"
                      >
                        <option value="">Select one</option>
                        <option value="chat">Chat</option>
                        <option value="call">Call</option>
                        <option value="project">Project Collab</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(3)}
                      className="px-6 h-12 rounded-xl border-primary/20 text-primary hover:bg-primary/10"
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setStep(role === "mentor" ? 5 : 5)}
                      disabled={skills.length === 0 || interests.length === 0 || !goals || availability.length === 0 || !interaction}
                      className="px-6 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 5: Mentor-specific fields */}
              {step === 5 && role === "mentor" && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-heading font-bold text-foreground mb-2">Mentor Profile</h2>
                    <p className="text-muted-foreground">Let's set up your mentor profile</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="mentor-location" className="text-foreground font-medium">Location</Label>
                      <Input
                        id="mentor-location"
                        type="text"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        required
                        className="h-12 rounded-xl border-primary/20 focus:border-primary transition-colors"
                        placeholder="Your City, Country"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile-pic" className="text-foreground font-medium">Profile Picture</Label>
                      <Input
                        id="profile-pic"
                        type="file"
                        accept="image/*"
                        onChange={e => setProfilePic(e.target.files?.[0] || null)}
                        required
                        className="h-12 rounded-xl border-primary/20 focus:border-primary transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="resume" className="text-foreground font-medium">Resume</Label>
                      <Input
                        id="resume"
                        type="file"
                        accept=".pdf,.jpg,.jpeg"
                        onChange={e => setResume(e.target.files?.[0] || null)}
                        required
                        className="h-12 rounded-xl border-primary/20 focus:border-primary transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(4)}
                      className="px-6 h-12 rounded-xl border-primary/20 text-primary hover:bg-primary/10"
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setStep(6)}
                      disabled={loading || !location || !profilePic || !resume}
                      className="px-6 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 5/6: Review & Submit */}
              {((step === 5 && role !== "mentor") || (step === 6 && role === "mentor")) && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-heading font-bold text-foreground mb-2">Review Your Profile</h2>
                    <p className="text-muted-foreground">Make sure everything looks good before we create your account</p>
                  </div>

                  <div className="bg-muted/50 rounded-xl p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="font-medium text-foreground">Name:</span> {name}</div>
                      <div><span className="font-medium text-foreground">Email:</span> {email}</div>
                      <div><span className="font-medium text-foreground">Role:</span> {role}</div>
                      <div><span className="font-medium text-foreground">Age/Year:</span> {age || year}</div>
                      <div><span className="font-medium text-foreground">Location:</span> {location}</div>
                      <div><span className="font-medium text-foreground">LinkedIn:</span> {linkedin || "(none)"}</div>
                      <div className="col-span-2"><span className="font-medium text-foreground">Skills:</span> {skills.join(", ")}</div>
                      <div className="col-span-2"><span className="font-medium text-foreground">Interests:</span> {interests.join(", ")}</div>
                      <div className="col-span-2"><span className="font-medium text-foreground">Goals:</span> {goals}</div>
                      <div className="col-span-2"><span className="font-medium text-foreground">Availability:</span> {availability.join(", ")}</div>
                      <div><span className="font-medium text-foreground">Interaction:</span> {interaction}</div>
                      {role === "mentor" && (
                        <>
                          <div><span className="font-medium text-foreground">Profile Pic:</span> {profilePic ? profilePic.name : "(none)"}</div>
                          <div><span className="font-medium text-foreground">Resume:</span> {resume ? resume.name : "(none)"}</div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(role === "mentor" ? 5 : 4)}
                      className="px-6 h-12 rounded-xl border-primary/20 text-primary hover:bg-primary/10"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="px-6 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {loading ? "Creating Account..." : "Create Account"}
                    </Button>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-primary text-sm font-medium">
                  Account created successfully! Redirecting to your dashboard...
                </div>
              )}
            </form>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-muted-foreground">
                Already have an account?{" "}
                <Link href="/auth/signin" className="text-primary hover:text-primary/80 font-medium transition-colors">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}
