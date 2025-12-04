"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { initiateCall, getPartnershipId } from "@/lib/calling";
import { Users, Filter, Search, Star, MapPin, Calendar, MessageCircle, RefreshCw, User, Heart, Sparkles, Phone, Video, Send, Inbox } from "lucide-react";
import { sendMatchRequest, listenOutgoingRequests, listenIncomingRequests, MatchRequest } from '@/lib/matchRequests'
import { PROFILE_TAGS } from "@/lib/profile-options";

interface MatchResult {
  user: any;
  score: number;
  reasons: string[];
  compatibility: {
    skills: number;
    interests: number;
    goals: number;
    availability: number;
    location: number;
  };
}

export default function MatchPage() {
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [outgoing, setOutgoing] = useState<MatchRequest[]>([])
  const [incoming, setIncoming] = useState<MatchRequest[]>([])
  
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchMatches();
    }
  }, [user]);

  // listen to requests
  useEffect(() => {
    if (!user) return
    const unsubOut = listenOutgoingRequests(user.uid, (reqs) => {
      setOutgoing(reqs)
    })
    const unsubIn = listenIncomingRequests(user.uid, (reqs) => {
      setIncoming(reqs)
    })
    return () => {
      unsubOut()
      unsubIn()
    }
  }, [user])

  const fetchMatches = async () => {
    if (!user) return;
    
    setLoading(true);
    setError("");
    
    try {
      // Directly import and call matching functions from client-side
      const { findBuddyMatches, findMentorMatches, findMenteeMatches } = await import('@/lib/matching-engine');
      
      let matches;
      if (user.role === 'buddy') {
        matches = await findBuddyMatches(user);
      } else if (user.role === 'mentor') {
        matches = await findMenteeMatches(user);
      } else if (user.role === 'mentee') {
        matches = await findMentorMatches(user);
      } else {
        matches = await findBuddyMatches(user);
      }
      
      setMatches(matches || []);
      setLastRefresh(new Date());
    } catch (err: any) {
      console.error("Match error:", err);
      setError(err.message || "Failed to fetch matches");
    } finally {
      setLoading(false);
    }
  };

  const toggleMultiSelect = (value: string, arr: string[], setArr: (a: string[]) => void, max: number) => {
    if (arr.includes(value)) {
      setArr(arr.filter((v) => v !== value));
    } else if (arr.length < max) {
      setArr([...arr, value]);
    }
  };

  const filteredMatches = matches.filter((match) => {
    const user = match.user;
    const lowerSearch = searchTerm.toLowerCase();
    const matchesSearch = user.name?.toLowerCase().includes(lowerSearch) ||
                         user.skills?.some((skill: string) => skill.toLowerCase().includes(lowerSearch)) ||
                         user.interests?.some((interest: string) => interest.toLowerCase().includes(lowerSearch)) ||
                         user.location?.toLowerCase().includes(lowerSearch);
    
    const matchesSkills = selectedSkills.length === 0 || 
                         selectedSkills.some(skill => user.skills?.some((userSkill: string) => userSkill.toLowerCase() === skill));
    
    const matchesInterests = selectedInterests.length === 0 || 
                           selectedInterests.some(interest => user.interests?.some((userInterest: string) => userInterest.toLowerCase() === interest));
    
    return matchesSearch && matchesSkills && matchesInterests;
  });

  const getMatchTypeTitle = () => {
    if (!user) return "Find Your Match";
    
    switch (user.role) {
      case 'buddy':
        return "Find Your Study Buddy";
      case 'mentor':
        return "Find Your Mentee";
      case 'mentee':
        return "Find Your Mentor";
      default:
        return "Find Your Match";
    }
  };

  const getMatchTypeDescription = () => {
    if (!user) return "Discover amazing people to connect with";
    
    switch (user.role) {
      case 'buddy':
        return "Connect with like-minded peers who share your goals and interests";
      case 'mentor':
        return "Find eager learners who can benefit from your expertise";
      case 'mentee':
        return "Connect with experienced mentors who can guide your journey";
      default:
        return "Discover amazing people to connect with";
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pear-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to view matches</h2>
          <button 
            onClick={() => router.push('/auth/signin')}
            className="bg-pear text-black px-6 py-3 rounded-xl font-medium hover:bg-pear/90 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pear-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-indigo-500 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-pear-500 bg-clip-text text-transparent">
              {getMatchTypeTitle()}
            </h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            {getMatchTypeDescription()}
          </p>
        </div>

        {/* Stats and Controls */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                <span className="text-gray-600">
                  {filteredMatches.length} {user.role === 'buddy' ? 'buddies' : user.role === 'mentor' ? 'mentees' : 'mentors'} found
                </span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
              <button
                onClick={fetchMatches}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-pear hover:bg-pear/90 text-black rounded-xl transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            <button
              onClick={() => router.push('/dashboard/match/requests')}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors"
              title="Incoming requests"
            >
              <Inbox className="w-4 h-4" />
              Requests ({incoming.filter(r => r.status === 'pending').length})
            </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, skills, interests, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skills ({selectedSkills.length}/5)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PROFILE_TAGS.slice(0, 20).map((tag) => (
                      <button
                        key={tag.value}
                        onClick={() => toggleMultiSelect(tag.value, selectedSkills, setSelectedSkills, 5)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          selectedSkills.includes(tag.value)
                            ? 'bg-indigo-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interests ({selectedInterests.length}/5)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PROFILE_TAGS.slice(20, 40).map((tag) => (
                      <button
                        key={tag.value}
                        onClick={() => toggleMultiSelect(tag.value, selectedInterests, setSelectedInterests, 5)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          selectedInterests.includes(tag.value)
                            ? 'bg-pear text-black'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
              <span className="text-gray-600">Finding your perfect matches...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">!</span>
              </div>
              <div>
                <h3 className="font-medium text-red-800">Error loading matches</h3>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Matches Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMatches.map((match, index) => (
              <div
                key={match.user.uid}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
              >
                {/* Match Score Badge */}
                <div className="relative">
                  <div className="absolute top-4 right-4 z-10">
                    <div className="bg-gradient-to-r from-indigo-500 to-pear-400 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {match.score}%
                    </div>
                  </div>
                  
                  {/* Profile Image */}
                  <div className="h-48 bg-gradient-to-br from-indigo-100 to-pear-100 flex items-center justify-center">
                    {match.user.profilePicUrl ? (
                      <img
                        src={match.user.profilePicUrl}
                        alt={match.user.name}
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-indigo-500 rounded-full flex items-center justify-center">
                        <User className="w-12 h-12 text-white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Profile Info */}
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{match.user.name}</h3>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{match.user.location || 'Location not specified'}</span>
                    </div>
                  </div>

                  {/* Compatibility Breakdown */}
                  <div className="mb-4">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span>Skills:</span>
                        <span className="font-medium">{Math.round(match.compatibility.skills)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Interests:</span>
                        <span className="font-medium">{Math.round(match.compatibility.interests)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Goals:</span>
                        <span className="font-medium">{Math.round(match.compatibility.goals)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Schedule:</span>
                        <span className="font-medium">{Math.round(match.compatibility.availability)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Match Reasons */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Why you match:</h4>
                    <div className="space-y-1">
                      {match.reasons.slice(0, 2).map((reason, idx) => (
                        <div key={idx} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                          {reason}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {match.user.skills?.slice(0, 4).map((skill: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                      {match.user.skills?.length > 4 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{match.user.skills.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action: Send/Requested/Respond only on Find page */}
                  <div className="flex gap-3">
                    {user.role === 'mentor' ? (
                      <button
                        onClick={() => router.push('/dashboard/match/requests')}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors flex items-center gap-2 w-full justify-center"
                      >
                        <Inbox className="w-4 h-4" />
                        Review Requests
                      </button>
                    ) : (() => {
                      // Check for any pending or accepted request (not just pending)
                      const hasOutgoingRequest = outgoing.some(r => 
                        (r.status === 'pending' || r.status === 'accepted') && 
                        r.receiverId === match.user.uid
                      )
                      const isIncomingFromUser = incoming.some(r => r.status === 'pending' && r.requesterId === match.user.uid)
                      
                      if (hasOutgoingRequest) {
                        return (
                          <button disabled className="px-4 py-2 bg-gray-200 text-gray-600 rounded-xl cursor-not-allowed flex items-center gap-2">
                            <Send className="w-4 h-4" /> Requested
                          </button>
                        )
                      }
                      if (isIncomingFromUser) {
                        return (
                          <button onClick={() => router.push('/dashboard/match/requests')} className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl flex items-center gap-2">
                            <Inbox className="w-4 h-4" /> Respond
                          </button>
                        )
                      }
                      return (
                        <button
                          onClick={async () => {
                            if (!user) return;
                            try {
                              await sendMatchRequest(match.user.uid)
                              // State will update via listener
                            } catch (e) {
                              console.error(e)
                              alert('Failed to send request')
                            }
                          }}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors flex items-center gap-2"
                          title="Send match request"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Matches */}
        {!loading && !error && filteredMatches.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No matches found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your filters or check back later for new users.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedSkills([]);
                setSelectedInterests([]);
              }}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}