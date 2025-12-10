"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, Sparkles, User, Target, FileText, CheckCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import Link from "next/link";
import { MultiCombobox } from "@/components/ui/multi-combobox";
import { PROFILE_TAGS } from "@/lib/profile-options";

const ROLES = [
  { value: "mentor", label: "Mentor", desc: "Guide others, share your expertise, and help mentees achieve their goals." },
  { value: "buddy", label: "Buddy", desc: "Find study partners, collaborate, and stay motivated together." },
  { value: "mentee", label: "Mentee", desc: "Learn from mentors, set goals, and track your progress." },
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

function SignupForm() {
  const router = useRouter();
  const { signUp } = useAuth();
  const searchParams = useSearchParams();
  const roleParam = searchParams?.get("role");

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form data
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(roleParam || "buddy");
  const [age, setAge] = useState("");
  const [location, setLocation] = useState("");
const [linkedin, setLinkedin] = useState("");
const [resumeUrl, setResumeUrl] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [goals, setGoals] = useState("");
  const [availability, setAvailability] = useState<string[]>([]);
  const [interaction, setInteraction] = useState("");

  const totalSteps = role === "mentor" ? 6 : 5;

  // Load form data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem("signup_form_data");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.name) setName(parsed.name);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.password) setPassword(parsed.password);
        if (parsed.role) setRole(parsed.role);
        if (parsed.age) setAge(parsed.age);
        if (parsed.location) setLocation(parsed.location);
        if (parsed.linkedin) setLinkedin(parsed.linkedin);
        if (parsed.resumeUrl) setResumeUrl(parsed.resumeUrl);
        if (parsed.skills) setSkills(parsed.skills);
        if (parsed.interests) setInterests(parsed.interests);
        if (parsed.goals) setGoals(parsed.goals);
        if (parsed.availability) setAvailability(parsed.availability);
        if (parsed.interaction) setInteraction(parsed.interaction);
        if (parsed.step) setStep(parsed.step);
      } catch (e) {
        console.error("Error loading saved form data:", e);
      }
    }
  }, []);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    const formData = {
      name,
      email,
      password,
      role,
      age,
      location,
      linkedin,
      resumeUrl,
      skills,
      interests,
      goals,
      availability,
      interaction,
      step,
    };
    localStorage.setItem("signup_form_data", JSON.stringify(formData));
  }, [name, email, password, role, age, location, linkedin, resumeUrl, skills, interests, goals, availability, interaction, step]);

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  const toggleMultiSelect = (value: string, arr: string[], setArr: (a: string[]) => void, max: number) => {
    if (arr.includes(value)) {
      setArr(arr.filter((v) => v !== value));
    } else if (arr.length < max) {
      setArr([...arr, value]);
    }
  };

  // Email validation function
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
      
      // Validate email format
      if (!isValidEmail(email)) {
        throw new Error("Please enter a valid email address");
      }
      
      // Validate password length
      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }
      
      if (role === "mentor" && !resumeUrl.trim()) {
        throw new Error("Mentors must include a portfolio or resume link");
      }
      
      // Create user data
      const userData = {
        email,
        password,
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
        resumeUrl: resumeUrl.trim(),
      };
      
      await signUp(userData);
      // Clear saved form data on successful signup
      localStorage.removeItem("signup_form_data");
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
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-12 rounded-xl border-primary/20 focus:border-primary transition-colors pr-10"
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
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
              {role === "mentor" && (
                <div className="space-y-2">
                  <Label htmlFor="resume-link" className="text-foreground font-medium">
                    Portfolio / Resume <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="resume-link"
                    type="url"
                    value={resumeUrl}
                    onChange={(e) => setResumeUrl(e.target.value)}
                    className="h-12 rounded-xl border-primary/20 focus:border-primary transition-colors"
                    placeholder="https://your-site.com/resume.pdf"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Show mentees what you have worked on—share a portfolio, resume, or case study link.
                  </p>
                </div>
              )}
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
              <MultiCombobox
                label="Skills"
                options={PROFILE_TAGS}
                value={skills}
                onChange={setSkills}
                maxSelected={5}
                placeholder="Type to search tools, domains, or soft skills"
                helperText="Select up to 5 skills. These options match exactly with mentor/mentee profiles."
              />
              <MultiCombobox
                label="Interests"
                options={PROFILE_TAGS}
                value={interests}
                onChange={setInterests}
                maxSelected={5}
                placeholder="Type to search interests, hobbies, or causes"
                helperText="Pick up to 5 interests. Same catalogue keeps buddy, mentor, and mentee matching consistent."
              />
              
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
