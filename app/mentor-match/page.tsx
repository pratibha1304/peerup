"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Heart,
  GraduationCap,
  MessageCircle,
  Search,
  Filter,
  Star,
  DollarSign,
  Calendar,
  Award,
  ArrowLeft,
  Video,
  Clock,
} from "lucide-react"

export default function MentorMatchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const categories = [
    { id: "all", name: "All Mentors" },
    { id: "programming", name: "Programming" },
    { id: "design", name: "Design" },
    { id: "business", name: "Business" },
    { id: "data-science", name: "Data Science" },
  ]

  const mentors = [
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      avatar: "/placeholder.svg?height=80&width=80",
      title: "Senior Full-Stack Developer",
      company: "Google",
      rating: 4.9,
      reviews: 127,
      hourlyRate: 75,
      expertise: ["React", "Node.js", "System Design", "Career Guidance"],
      category: "programming",
      experience: "8+ years",
      bio: "Former Google engineer with expertise in scalable web applications. I help students transition from learning to professional development.",
      availability: "Weekends",
      responseTime: "< 2 hours",
      languages: ["English", "Spanish"],
      isVerified: true,
      totalSessions: 340,
    },
    {
      id: 2,
      name: "Michael Chen",
      avatar: "/placeholder.svg?height=80&width=80",
      title: "Lead Data Scientist",
      company: "Microsoft",
      rating: 4.8,
      reviews: 89,
      hourlyRate: 85,
      expertise: ["Python", "Machine Learning", "Deep Learning", "Statistics"],
      category: "data-science",
      experience: "6+ years",
      bio: "Data science leader passionate about teaching ML concepts and helping students build real-world projects.",
      availability: "Evenings",
      responseTime: "< 4 hours",
      languages: ["English", "Mandarin"],
      isVerified: true,
      totalSessions: 256,
    },
    {
      id: 3,
      name: "Emily Rodriguez",
      avatar: "/placeholder.svg?height=80&width=80",
      title: "Senior UX Designer",
      company: "Airbnb",
      rating: 4.9,
      reviews: 156,
      hourlyRate: 65,
      expertise: ["UI/UX Design", "Figma", "User Research", "Design Systems"],
      category: "design",
      experience: "7+ years",
      bio: "Design leader with experience in consumer products. I help aspiring designers build strong portfolios and land their dream jobs.",
      availability: "Flexible",
      responseTime: "< 1 hour",
      languages: ["English"],
      isVerified: true,
      totalSessions: 423,
    },
    {
      id: 4,
      name: "David Kim",
      avatar: "/placeholder.svg?height=80&width=80",
      title: "Product Manager",
      company: "Stripe",
      rating: 4.7,
      reviews: 73,
      hourlyRate: 90,
      expertise: ["Product Strategy", "Business Analysis", "Startup Advice", "Leadership"],
      category: "business",
      experience: "10+ years",
      bio: "Product leader and startup advisor. I help students understand business fundamentals and develop entrepreneurial skills.",
      availability: "Mornings",
      responseTime: "< 6 hours",
      languages: ["English", "Korean"],
      isVerified: true,
      totalSessions: 189,
    },
  ]

  const filteredMentors = mentors.filter((mentor) => {
    const matchesSearch =
      mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.expertise.some((skill) => skill.toLowerCase().includes(searchQuery.toLowerCase())) ||
      mentor.title.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategory === "all" || mentor.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFFEEC] via-white to-[#FFFFEEC]">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#CBD83B] to-[#A88AED] rounded-xl flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-[#CBD83B] to-[#A88AED] bg-clip-text text-transparent">
                PeerUP
              </span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <MessageCircle className="w-4 h-4 mr-2" />
              Messages
            </Button>
            <Avatar className="w-8 h-8">
              <AvatarImage src="/placeholder.svg?height=32&width=32" />
              <AvatarFallback>AB</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center">
            <GraduationCap className="w-8 h-8 mr-3 text-[#A88AED]" />
            Find Your Mentor
          </h1>
          <p className="text-xl text-gray-600">
            Get guidance from experienced professionals with structured mentorship
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <Card className="border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search by name, skills, or expertise..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 rounded-xl border-gray-200 focus:border-[#A88AED] focus:ring-[#A88AED]"
                    />
                  </div>
                  <Button variant="outline" className="rounded-xl bg-transparent">
                    <Filter className="w-4 h-4 mr-2" />
                    Advanced Filters
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                      className={`rounded-xl ${
                        selectedCategory === category.id
                          ? "bg-[#A88AED] hover:bg-[#A88AED]/90"
                          : "hover:border-[#A88AED] hover:text-[#A88AED]"
                      }`}
                    >
                      {category.name}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mentor Results */}
        <div className="grid gap-6">
          {filteredMentors.map((mentor) => (
            <Card
              key={mentor.id}
              className="border-0 shadow-lg rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Profile Section */}
                  <div className="flex items-start space-x-4">
                    <div className="relative">
                      <Avatar className="w-20 h-20">
                        <AvatarImage src={mentor.avatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {mentor.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      {mentor.isVerified && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#A88AED] rounded-full flex items-center justify-center">
                          <Award className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{mentor.name}</h3>
                        {mentor.isVerified && <Badge className="bg-[#A88AED]/20 text-[#A88AED]">Verified</Badge>}
                      </div>
                      <p className="text-lg text-gray-700 font-medium mb-1">{mentor.title}</p>
                      <p className="text-gray-600 mb-2">
                        {mentor.company} • {mentor.experience}
                      </p>
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{mentor.rating}</span>
                          <span className="text-gray-600 text-sm">({mentor.reviews} reviews)</span>
                        </div>
                        <div className="flex items-center space-x-1 text-green-600">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-medium">${mentor.hourlyRate}/hour</span>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-3">{mentor.bio}</p>
                      <div className="flex flex-wrap gap-2">
                        {mentor.expertise.map((skill, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="bg-[#A88AED]/20 text-[#A88AED] hover:bg-[#A88AED]/30"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Details Section */}
                  <div className="lg:w-80 space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{mentor.availability}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{mentor.responseTime}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Video className="w-4 h-4" />
                        <span>{mentor.totalSessions} sessions</span>
                      </div>
                      <div className="text-gray-600">
                        <span>{mentor.languages.join(", ")}</span>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-[#A88AED]/10 to-[#CBD83B]/10 p-4 rounded-2xl">
                      <h4 className="font-semibold text-gray-900 mb-2">What you'll get:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• 1-on-1 video sessions</li>
                        <li>• Personalized learning plan</li>
                        <li>• Career guidance & feedback</li>
                        <li>• Project reviews & mentorship</li>
                      </ul>
                    </div>

                    <div className="flex space-x-3">
                      <Button className="flex-1 bg-[#A88AED] hover:bg-[#A88AED]/90 text-white rounded-xl">
                        <Calendar className="w-4 h-4 mr-2" />
                        Book Session
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-xl border-[#A88AED] text-[#A88AED] hover:bg-[#A88AED]/10 bg-transparent"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredMentors.length === 0 && (
          <Card className="border-0 shadow-lg rounded-3xl">
            <CardContent className="p-12 text-center">
              <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No mentors found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your search criteria or browse different categories.</p>
              <Button
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategory("all")
                }}
                className="bg-[#A88AED] hover:bg-[#A88AED]/90 text-white rounded-xl"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
