"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { Users, Filter, Search, Star, MapPin, Calendar, MessageCircle, RefreshCw, User } from "lucide-react";

const SKILLS_LIST = [
  "javascript", "python", "java", "c++", "react", "node.js", "express", "mongodb", "sql", "typescript", "html", "css", "ui/ux", "design", "marketing", "business", "data science", "machine learning", "ai", "cloud", "aws", "azure", "gcp", "devops", "docker", "kubernetes", "git", "figma", "photoshop", "illustrator", "writing", "public speaking", "photography", "music", "finance", "accounting", "product management", "project management", "leadership", "teamwork", "problem solving", "critical thinking", "communication", "sales", "content creation", "seo", "social media", "video editing", "animation", "cybersecurity", "blockchain", "solidity", "flutter", "android", "ios", "swift", "kotlin", "go", "ruby", "php", "laravel", "django", "flask", "r", "matlab", "statistics", "research", "biology", "chemistry", "physics", "mathematics", "economics", "psychology", "education", "teaching", "coaching", "mentoring", "sports", "fitness", "yoga", "meditation", "health", "nutrition", "cooking", "baking", "languages", "french", "spanish", "german", "hindi", "chinese", "japanese", "korean", "arabic", "travel", "gaming", "esports", "volunteering", "sustainability", "environment", "robotics", "electronics", "hardware", "networking", "testing", "qa", "customer support", "hr", "recruitment", "legal", "law", "medicine", "nursing", "veterinary", "architecture", "interior design", "fashion", "event planning", "journalism", "blogging", "podcasting", "comedy", "acting", "film", "theatre", "dance", "painting", "sculpture", "calligraphy", "crafts", "diy", "gardening", "parenting", "pets", "astrology", "spirituality", "philosophy", "history", "politics", "international relations"
];

// Simple matching function
function calculateMatchScore(user: any, candidate: any) {
  let score = 0;
  
  // Skills matching (3 points per matching skill)
  const userSkills = (user.skills || []).map((s: string) => s.toLowerCase());
  const candidateSkills = (candidate.skills || []).map((s: string) => s.toLowerCase());
  userSkills.forEach((skill: string) => {
    if (candidateSkills.includes(skill)) score += 3;
  });
  
  // Interests matching (2 points per matching interest)
  const userInterests = (user.interests || []).map((i: string) => i.toLowerCase());
  const candidateInterests = (candidate.interests || []).map((i: string) => i.toLowerCase());
  userInterests.forEach((interest: string) => {
    if (candidateInterests.includes(interest)) score += 2;
  });
  
  // Availability matching (1 point per matching availability)
  const userAvail = (user.availability || []).map((a: string) => a.toLowerCase());
  const candidateAvail = (candidate.availability || []).map((a: string) => a.toLowerCase());
  userAvail.forEach((avail: string) => {
    if (candidateAvail.includes(avail)) score += 1;
  });
  
  // Base score for any valid candidate
  if (score === 0) score = 1;
  
  return score;
}

export default function MatchPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchProfileAndMatches = async () => {
      setLoading(true);
      setError("");
      try {
        const user = auth.currentUser;
        if (!user) {
          router.push("/auth/signin");
          return;
        }

        // Get current user profile
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
          setError("Profile not found. Please complete your profile first.");
          setLoading(false);
          return;
        }

        const userProfile = userDoc.data();
        setProfile(userProfile);
        
        console.log("Current user profile:", userProfile);

        // Get all users from Firestore
        const usersSnapshot = await getDocs(collection(db, "users"));
        const allUsers = usersSnapshot.docs.map(doc => doc.data());
        
        console.log("Total users in database:", allUsers.length);

        // Filter available users (exclude current user and pending reviews)
        const availableUsers = allUsers.filter((u: any) => 
          u.uid !== userProfile.uid && 
          u.status !== 'pending_review' && 
          u.role && 
          u.skills && 
          u.skills.length > 0
        );
        
        console.log("Available users:", availableUsers.length);

        // Role-based matching
        let candidates;
        if (userProfile.role === 'buddy') {
          candidates = availableUsers.filter((u: any) => u.role === 'buddy');
        } else if (userProfile.role === 'mentor') {
          candidates = availableUsers.filter((u: any) => u.role === 'mentee');
        } else if (userProfile.role === 'mentee') {
          candidates = availableUsers.filter((u: any) => u.role === 'mentor');
        } else {
          // If no role specified, show all available users
          candidates = availableUsers;
        }

        // Fallback: if no role-specific matches, show all available users
        if (candidates.length === 0) {
          console.log("No role-specific matches, showing all available users");
          candidates = availableUsers;
        }

        console.log("Candidates found:", candidates.length);

        // Calculate match scores and sort
        const scoredMatches = candidates
          .map((candidate: any) => ({
            user: candidate,
            score: calculateMatchScore(userProfile, candidate)
          }))
          .sort((a: any, b: any) => b.score - a.score)
          .slice(0, 20); // Top 20 matches

        console.log("Final matches:", scoredMatches.length);
        console.log("Match scores:", scoredMatches.map((m: any) => ({ name: m.user.name, score: m.score })));

        setMatches(scoredMatches);
      } catch (err: any) {
        console.error("Match error:", err);
        setError(err.message || "Failed to fetch matches");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndMatches();
  }, [router]);

  const toggleMultiSelect = (value: string, arr: string[], setArr: (a: string[]) => void, max: number) => {
    if (arr.includes(value)) {
      setArr(arr.filter((v) => v !== value));
    } else if (arr.length < max) {
      setArr([...arr, value]);
    }
  };

  const filteredMatches = matches.filter((match: any) => {
    const user = match.user;
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.skills?.some((skill: string) => skill.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         user.interests?.some((interest: string) => interest.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSkills = selectedSkills.length === 0 || 
                         selectedSkills.some(skill => user.skills?.includes(skill));
    
    const matchesInterests = selectedInterests.length === 0 || 
                            selectedInterests.some(interest => user.interests?.includes(interest));

    return matchesSearch && matchesSkills && matchesInterests;
  });

  const getMatchType = () => {
    if (!profile) return "";
    if (profile.role === "buddy") return "Buddy";
    if (profile.role === "mentor") return "Mentee";
    if (profile.role === "mentee") return "Mentor";
    return "Match";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-[#85BCB1]" />
          <div className="text-lg">Finding your perfect match...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#85BCB1] text-white rounded-lg hover:bg-[#645990] transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#645990] dark:text-[#85BCB1] mb-2">
          Find {getMatchType()}
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Discover amazing people who share your interests and goals.
        </p>
        {profile && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Your role: <span className="font-semibold">{profile.role}</span> | 
            Your skills: <span className="font-semibold">{profile.skills?.length || 0}</span> skills |
            Found: <span className="font-semibold">{matches.length}</span> potential matches
          </p>
        )}
      </div>

      {/* Search and Filters UI */}
      <div className="bg-white dark:bg-[#23272f] rounded-xl p-6 shadow mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, skills, or interests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#85BCB1] focus:border-transparent"
              />
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-[#85BCB1] text-white rounded-lg hover:bg-[#645990] transition"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Skills Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Skills ({selectedSkills.length}/5)
              </label>
              <div className="flex flex-wrap gap-2">
                {SKILLS_LIST.slice(0, 10).map((skill) => (
                  <button
                    key={skill}
                    onClick={() => toggleMultiSelect(skill, selectedSkills, setSelectedSkills, 5)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                      selectedSkills.includes(skill)
                        ? "bg-[#645990] text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Interests Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Interests ({selectedInterests.length}/5)
              </label>
              <div className="flex flex-wrap gap-2">
                {SKILLS_LIST.slice(10, 20).map((interest) => (
                  <button
                    key={interest}
                    onClick={() => toggleMultiSelect(interest, selectedInterests, setSelectedInterests, 5)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                      selectedInterests.includes(interest)
                        ? "bg-[#645990] text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {filteredMatches.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No matches found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {profile?.role === 'mentor' 
              ? "No mentees available right now. Check back later or try adjusting your filters."
              : profile?.role === 'mentee'
              ? "No mentors available right now. Check back later or try adjusting your filters."
              : "No buddies available right now. Check back later or try adjusting your filters."
            }
          </p>
          <div className="text-sm text-gray-400">
            <p>Make sure your profile is complete with skills and interests.</p>
            <p>Try removing some filters to see more results.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMatches.map((match: any, index: number) => (
            <div key={match.user.uid} className="bg-white dark:bg-[#23272f] rounded-xl p-6 shadow hover:shadow-lg transition">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                  {match.user.profilePicUrl ? (
                    <img
                      src={match.user.profilePicUrl}
                      alt={match.user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {match.user.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <span className="capitalize bg-[#85BCB1] text-white px-2 py-1 rounded-full text-xs">
                      {match.user.role}
                    </span>
                    {match.user.location && (
                      <>
                        <MapPin className="w-3 h-3" />
                        <span>{match.user.location}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${i < 4 ? "fill-current" : ""}`}
                      />
                    ))}
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">4.5</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-[#645990] dark:text-[#85BCB1]">
                    {match.score} pts
                  </div>
                </div>
              </div>

              {match.user.goals && (
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Goals
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {match.user.goals}
                  </div>
                </div>
              )}

              {match.user.skills && match.user.skills.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Skills
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {match.user.skills.slice(0, 3).map((skill: string) => (
                      <span
                        key={skill}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded"
                      >
                        {skill}
                      </span>
                    ))}
                    {match.user.skills.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded">
                        +{match.user.skills.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {match.user.availability && match.user.availability.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Available
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {match.user.availability.slice(0, 2).map((time: string) => (
                      <span
                        key={time}
                        className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded"
                      >
                        {time}
                      </span>
                    ))}
                    {match.user.availability.length > 2 && (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded">
                        +{match.user.availability.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#85BCB1] text-white rounded-lg hover:bg-[#645990] transition">
                  <MessageCircle className="w-4 h-4" />
                  Message
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-[#85BCB1] text-[#85BCB1] rounded-lg hover:bg-[#85BCB1] hover:text-white transition">
                  <Calendar className="w-4 h-4" />
                  Schedule
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}