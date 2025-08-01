"use client";
import { useEffect, useState, useRef } from "react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { User, Camera, Save, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";

const ROLES = [
  { value: "mentor", label: "Mentor", desc: "Guide others, share your expertise" },
  { value: "buddy", label: "Buddy", desc: "Find study partners, collaborate together" },
  { value: "mentee", label: "Mentee", desc: "Learn from mentors, track progress" },
];

const SKILLS_LIST = [
  "javascript", "python", "java", "c++", "react", "node.js", "express", "mongodb", "sql", "typescript", "html", "css", "ui/ux", "design", "marketing", "business", "data science", "machine learning", "ai", "cloud", "aws", "azure", "gcp", "devops", "docker", "kubernetes", "git", "figma", "photoshop", "illustrator", "writing", "public speaking", "photography", "music", "finance", "accounting", "product management", "project management", "leadership", "teamwork", "problem solving", "critical thinking", "communication", "sales", "content creation", "seo", "social media", "video editing", "animation", "cybersecurity", "blockchain", "solidity", "flutter", "android", "ios", "swift", "kotlin", "go", "ruby", "php", "laravel", "django", "flask", "r", "matlab", "statistics", "research", "biology", "chemistry", "physics", "mathematics", "economics", "psychology", "education", "teaching", "coaching", "mentoring", "sports", "fitness", "yoga", "meditation", "health", "nutrition", "cooking", "baking", "languages", "french", "spanish", "german", "hindi", "chinese", "japanese", "korean", "arabic", "travel", "gaming", "esports", "volunteering", "sustainability", "environment", "robotics", "electronics", "hardware", "networking", "testing", "qa", "customer support", "hr", "recruitment", "legal", "law", "medicine", "nursing", "veterinary", "architecture", "interior design", "fashion", "event planning", "journalism", "blogging", "podcasting", "comedy", "acting", "film", "theatre", "dance", "painting", "sculpture", "calligraphy", "crafts", "diy", "gardening", "parenting", "pets", "astrology", "spirituality", "philosophy", "history", "politics", "international relations"
];

const AVAILABILITY_OPTIONS = [
  "Mornings", "Afternoons", "Evenings", "Nights", "Weekdays", "Weekends"
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const storage = getStorage();

  // Form fields
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [age, setAge] = useState("");
  const [location, setLocation] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [goals, setGoals] = useState("");
  const [availability, setAvailability] = useState<string[]>([]);
  const [interaction, setInteraction] = useState("");
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [profilePicUrl, setProfilePicUrl] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        
      } catch (e) {
        setError("Failed to fetch profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePic(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
    
      setSuccess(true);
     
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const toggleMultiSelect = (value: string, arr: string[], setArr: (a: string[]) => void, max: number) => {
    if (arr.includes(value)) {
      setArr(arr.filter((v) => v !== value));
    } else if (arr.length < max) {
      setArr([...arr, value]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading your profile...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#645990] dark:text-[#85BCB1] mb-2">Edit Your Profile</h1>
        <p className="text-gray-600 dark:text-gray-300">Update your info, switch roles, and show off your skills.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl text-sm font-semibold bg-red-100 text-red-700 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-xl text-sm font-semibold bg-green-100 text-green-700 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Profile updated successfully!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Picture Section */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-[#23272f] rounded-xl p-6 shadow">
            <h2 className="text-xl font-semibold mb-4 text-[#2C6485] dark:text-[#85BCB1]">Profile Picture</h2>
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <img
                  src={profilePicUrl || "/placeholder-user.jpg"}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-[#85BCB1]"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-[#85BCB1] text-white p-2 rounded-full hover:bg-[#645990] transition"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <p className="text-sm text-gray-500 text-center">
                Click the camera icon to upload a new picture
              </p>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-[#23272f] rounded-xl p-6 shadow">
            <h2 className="text-xl font-semibold mb-6 text-[#2C6485] dark:text-[#85BCB1]">Personal Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block mb-2 font-medium">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#85BCB1] focus:border-transparent"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block mb-2 font-medium">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#85BCB1] focus:border-transparent"
                >
                  <option value="">Select role</option>
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label} - {r.desc}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 font-medium">Age/Year</label>
                <input
                  type="text"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#85BCB1] focus:border-transparent"
                  placeholder="19, 2nd year, etc."
                />
              </div>
              <div>
                <label className="block mb-2 font-medium">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#85BCB1] focus:border-transparent"
                  placeholder="City, Country"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block mb-2 font-medium">LinkedIn (optional)</label>
              <input
                type="url"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#85BCB1] focus:border-transparent"
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>

            <div className="mb-6">
              <label className="block mb-2 font-medium">Goals</label>
              <textarea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#85BCB1] focus:border-transparent"
                rows={3}
                placeholder="What do you want to achieve?"
              />
            </div>

            <div className="mb-6">
              <label className="block mb-2 font-medium">Skills (max 5)</label>
              <div className="flex flex-wrap gap-2">
                {SKILLS_LIST.slice(0, 20).map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleMultiSelect(skill, skills, setSkills, 5)}
                    className={`px-3 py-1 rounded-full text-sm border ${
                      skills.includes(skill)
                        ? "bg-[#85BCB1] text-white border-[#85BCB1]"
                        : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Selected: {skills.join(", ")}</p>
            </div>

            <div className="mb-6">
              <label className="block mb-2 font-medium">Interests (max 5)</label>
              <div className="flex flex-wrap gap-2">
                {SKILLS_LIST.slice(20, 40).map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleMultiSelect(interest, interests, setInterests, 5)}
                    className={`px-3 py-1 rounded-full text-sm border ${
                      interests.includes(interest)
                        ? "bg-[#645990] text-white border-[#645990]"
                        : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Selected: {interests.join(", ")}</p>
            </div>

            <div className="mb-6">
              <label className="block mb-2 font-medium">Availability</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABILITY_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleMultiSelect(option, availability, setAvailability, AVAILABILITY_OPTIONS.length)}
                    className={`px-3 py-1 rounded-full text-sm border ${
                      availability.includes(option)
                        ? "bg-[#2C6485] text-white border-[#2C6485]"
                        : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block mb-2 font-medium">Preferred Interaction</label>
              <select
                value={interaction}
                onChange={(e) => setInteraction(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#85BCB1] focus:border-transparent"
              >
                <option value="">Select one</option>
                <option value="chat">Chat</option>
                <option value="call">Call</option>
                <option value="project">Project Collab</option>
              </select>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-[#85BCB1] text-white rounded-lg font-semibold hover:bg-[#645990] transition disabled:opacity-50"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}