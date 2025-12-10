"use client";
import { useEffect, useState, useRef } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { User, Camera, Save, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { MultiCombobox } from "@/components/ui/multi-combobox";
import { PROFILE_TAGS } from "@/lib/profile-options";
import { useAuth } from "@/lib/auth-context";
import { storage } from "@/lib/firebase";

const ROLES = [
  { value: "mentor", label: "Mentor", desc: "Guide others, share your expertise" },
  { value: "buddy", label: "Buddy", desc: "Find study partners, collaborate together" },
  { value: "mentee", label: "Mentee", desc: "Learn from mentors, track progress" },
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
  const [resumeUrl, setResumeUrl] = useState("");
  const { user, loading: authLoading, updateProfile } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    setProfile(user);
    setName(user.name || "");
    setRole(user.role || "");
    setAge(user.age || "");
    setLocation(user.location || "");
    setLinkedin(user.linkedin || "");
    setSkills(user.skills || []);
    setInterests(user.interests || []);
    setGoals(user.goals || "");
    setAvailability(user.availability || []);
    setInteraction(user.interaction || "");
    setProfilePicUrl(user.profilePicUrl || "");
    setResumeUrl(user.resumeUrl || "");
    setLoading(false);
  }, [authLoading, user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePic(file);
      const previewUrl = URL.createObjectURL(file);
      setProfilePicUrl(previewUrl);
    }
  };

  useEffect(() => {
    if (!profilePicUrl || !profilePicUrl.startsWith("blob:")) return;
    return () => {
      URL.revokeObjectURL(profilePicUrl);
    };
  }, [profilePicUrl]);

  const handleSave = async () => {
    if (!user) {
      setError("You must be signed in to update your profile.");
      return;
    }
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!role) {
      setError("Please select a role.");
      return;
    }
    if (role === "mentor" && !resumeUrl.trim()) {
      setError("Mentors must include a portfolio or resume link.");
      return;
    }
    
    setSaving(true);
    setError("");
    setSuccess(false);
    
    try {
      let uploadedUrl = user.profilePicUrl || "";
      
      // Upload new profile picture if one was selected
      if (profilePic) {
        console.log("Uploading profile picture...");
        try {
          const fileRef = ref(storage, `profile-pictures/${user.uid}/${Date.now()}-${profilePic.name}`);
          await uploadBytes(fileRef, profilePic);
          uploadedUrl = await getDownloadURL(fileRef);
          console.log("Profile picture uploaded successfully:", uploadedUrl);
          setProfilePic(null);
          // Revoke the blob URL if it exists
          if (profilePicUrl && profilePicUrl.startsWith("blob:")) {
            URL.revokeObjectURL(profilePicUrl);
          }
        } catch (uploadError: any) {
          console.error("Upload error:", uploadError);
          setSaving(false);
          throw new Error(`Failed to upload image: ${uploadError.message}`);
        }
      } else if (profilePicUrl && !profilePicUrl.startsWith("blob:") && profilePicUrl.startsWith("http")) {
        // If it's a valid HTTP URL (not a blob preview), use it
        uploadedUrl = profilePicUrl;
      }
      // Otherwise, keep the existing user.profilePicUrl (already set above)

      const updates: any = {
        name: name.trim(),
        role: role as 'mentor' | 'buddy' | 'mentee',
        profilePicUrl: uploadedUrl,
      };

      // Add optional fields only if they have values
      if (age.trim()) updates.age = age.trim();
      if (location.trim()) updates.location = location.trim();
      if (linkedin.trim()) updates.linkedin = linkedin.trim();
      if (skills.length > 0) updates.skills = skills;
      if (interests.length > 0) updates.interests = interests;
      if (goals.trim()) updates.goals = goals.trim();
      if (availability.length > 0) updates.availability = availability;
      if (interaction) updates.interaction = interaction;
      if (resumeUrl.trim()) updates.resumeUrl = resumeUrl.trim();

      console.log("Updating profile with:", updates);
      await updateProfile(updates);
      console.log("Profile updated successfully");
      
      setProfile((prev: any) => ({ ...(prev || {}), ...updates }));
      if (uploadedUrl) {
        setProfilePicUrl(uploadedUrl);
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("Profile update error:", err);
      setError(err.message || "Failed to save profile. Please try again.");
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

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading your profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">You need to be signed in</h2>
          <p className="text-gray-500">Log in again to edit your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#645990] dark:text-[#85BCB1] mb-2">Edit Your Profile</h1>
        <p className="text-gray-600 dark:text-gray-300">Update your info, switch roles, and show off your skills.</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Changes are shared with your matches instantly. Mentors must keep an up-to-date portfolio or resume link on file.
          </p>
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
              <div className="w-full mt-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Snapshot</h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <p><span className="font-medium text-gray-800 dark:text-gray-100">Email:</span> {profile?.email}</p>
                  <p><span className="font-medium text-gray-800 dark:text-gray-100">Role:</span> {profile?.role}</p>
                  {profile?.resumeUrl && (
                    <p>
                      <span className="font-medium text-gray-800 dark:text-gray-100">Portfolio:</span>{" "}
                      <a href={profile.resumeUrl} target="_blank" rel="noreferrer" className="text-[#2C6485] hover:underline">
                        View link
                      </a>
                    </p>
                  )}
                  {profile?.availability?.length ? (
                    <p>
                      <span className="font-medium text-gray-800 dark:text-gray-100">Availability:</span>{" "}
                      {profile.availability.join(", ")}
                    </p>
                  ) : null}
                </div>
              </div>
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
              <label className="block mb-2 font-medium">
                Portfolio / Resume {role === "mentor" && <span className="text-red-500">*</span>}
              </label>
              <input
                type="url"
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#85BCB1] focus:border-transparent"
                placeholder="https://your-site.com/resume.pdf"
                required={role === "mentor"}
              />
              <p className="text-xs text-gray-500 mt-2">
                Share a portfolio, resume, or calendar link so mentees can verify your experience.
              </p>
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
              <MultiCombobox
                label="Skills (max 5)"
                options={PROFILE_TAGS}
                value={skills}
                onChange={setSkills}
                maxSelected={5}
                placeholder="Type to search skills, tools, or domains"
                helperText={`Selected ${skills.length}/5 skills. The same options are used across roles for accurate matching.`}
              />
            </div>

            <div className="mb-6">
              <MultiCombobox
                label="Interests (max 5)"
                options={PROFILE_TAGS}
                value={interests}
                onChange={setInterests}
                maxSelected={5}
                placeholder="Type to search interests or activities"
                helperText={`Selected ${interests.length}/5 interests. Pick what excites you, not just study topics.`}
              />
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