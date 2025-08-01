"use client";
import React, { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ChevronDown, ArrowLeft, Sparkles, User, Target, FileText, CheckCircle } from "lucide-react";
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
  "javascript", "python", "java", "c++", "react", "node.js", "angular", "vue.js",
  "typescript", "php", "ruby", "go", "rust", "swift", "kotlin", "dart",
  "html", "css", "sass", "less", "bootstrap", "tailwind", "material-ui",
  "mongodb", "postgresql", "mysql", "redis", "elasticsearch", "firebase",
  "aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "git",
  "machine learning", "data science", "ai", "blockchain", "cybersecurity",
  "mobile development", "web development", "game development", "devops",
  "ui/ux design", "graphic design", "digital marketing", "content creation"
];

const INTERESTS_LIST = [
  "web development", "mobile development", "data science", "machine learning",
  "artificial intelligence", "blockchain", "cybersecurity", "cloud computing",
  "devops", "game development", "ui/ux design", "digital marketing",
  "content creation", "startups", "entrepreneurship", "product management",
  "project management", "agile", "scrum", "lean methodology",
  "open source", "contributing", "mentoring", "teaching",
  "public speaking", "writing", "blogging", "podcasting",
  "networking", "community building", "leadership", "team building"
];

const AVAILABILITY_OPTIONS = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

const INTERACTION_OPTIONS = [
  { value: "video", label: "Video Call", desc: "Face-to-face interaction" },
  { value: "voice", label: "Voice Call", desc: "Audio-only communication" },
  { value: "chat", label: "Chat Only", desc: "Text-based communication" },
  { value: "mixed", label: "Mixed", desc: "Combination of methods" },
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
  const { signUp } = useAuth();
  const searchParams = useSearchParams();
  const roleParam = searchParams?.get("role");

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Form data
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(roleParam || "buddy");
  const [age, setAge] = useState("");
  const [location, setLocation] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [goals, setGoals] = useState("");
  const [availability, setAvailability] = useState<string[]>([]);
  const [interaction, setInteraction] = useState("");

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
      
      // Create user data
      const userData = {
        email,
        name,
        role: role as 'mentor' | 'buddy' | 'mentee',
        age: age || "",
        location: location || "",
        linkedin: linkedin || "",
        skills: skills || [],
        interests: interests || [],
        goals: goals || "",
        availability: availability || [],
        interaction: interaction || "",
        profilePicUrl: "",
        resumeUrl: "",
      };
      
      await signUp(userData);
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-heading font-bold text-foreground mb-2">Welcome to PeerUP!</h2>
              <p className="text-muted-foreground">Let's get you started on your journey</p>
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
          </div>
        );

      case 2:
        return (
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
          </div>
        );

      case 3:
        return (
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
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-heading font-bold text-foreground mb-2">Skills & Interests</h2>
              <p className="text-muted-foreground">What are you passionate about?</p>
            </div>
            
            <div className="space-y-6">
              <MultiSelectDropdown label="Skills" options={SKILLS_LIST} selected={skills} setSelected={setSkills} max={5} />
              <MultiSelectDropdown label="Interests" options={INTERESTS_LIST} selected={interests} setSelected={setInterests} max={3} />
              
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
                      key={option.value}
                      variant={availability.includes(option.value) ? "default" : "outline"}
                      className={`rounded-full ${
                        availability.includes(option.value) 
                          ? "bg-primary text-primary-foreground" 
                          : "border-primary/20 text-foreground hover:border-primary/40"
                      }`}
                      onClick={() => toggleMultiSelect(option.value, availability, setAvailability, AVAILABILITY_OPTIONS.length)}
                    >
                      {option.label}
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
                  <option value="video">Video Call</option>
                  <option value="voice">Voice Call</option>
                  <option value="chat">Chat Only</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
            </div>
          </div>
        );

      default:
        return null;
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

            {error && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-xl text-primary text-sm font-medium">
                Account created successfully! Redirecting to your dashboard...
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-6">
              {renderStep()}

              <div className="flex justify-between">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="px-6 h-12 rounded-xl border-primary/20 text-primary hover:bg-primary/10"
                  >
                    Back
                  </Button>
                )}
                
                {step < totalSteps ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="ml-auto px-6 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="ml-auto px-6 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    disabled={loading}
                  >
                    {loading ? "Creating Account..." : "Create Account"}
                  </Button>
                )}
              </div>
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

            {/* Demo Note */}
            <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-600 text-xs text-center">
                💡 Demo Mode: All fields are optional except name, email, and password
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
    <Suspense fallback={<div>Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}
