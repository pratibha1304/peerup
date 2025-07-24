"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Heart,
  Shield,
  Users,
  GraduationCap,
  DollarSign,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Phone,
  Mail,
  Download,
} from "lucide-react"

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("overview")

  const stats = {
    totalUsers: 2847,
    activeMentors: 156,
    pendingApplications: 23,
    totalRevenue: 45670,
    monthlyGrowth: 12.5,
  }

  const pendingMentors = [
    {
      id: 1,
      name: "Jennifer Walsh",
      email: "jennifer.walsh@email.com",
      title: "Senior Software Engineer",
      company: "Netflix",
      experience: "7 years",
      expertise: ["React", "Node.js", "AWS", "System Design"],
      appliedDate: "2024-01-15",
      resumeUrl: "#",
      status: "pending",
    },
    {
      id: 2,
      name: "Robert Chen",
      email: "robert.chen@email.com",
      title: "Data Science Manager",
      company: "Tesla",
      experience: "9 years",
      expertise: ["Python", "Machine Learning", "Statistics", "Leadership"],
      appliedDate: "2024-01-14",
      resumeUrl: "#",
      status: "pending",
    },
    {
      id: 3,
      name: "Maria Garcia",
      email: "maria.garcia@email.com",
      title: "Product Design Lead",
      company: "Adobe",
      experience: "6 years",
      expertise: ["UI/UX", "Figma", "Design Systems", "User Research"],
      appliedDate: "2024-01-13",
      resumeUrl: "#",
      status: "pending",
    },
  ]

  const recentSessions = [
    {
      id: 1,
      mentor: "Dr. Sarah Johnson",
      mentee: "Alex Rodriguez",
      topic: "Career Transition to Tech",
      date: "2024-01-15",
      duration: "60 min",
      amount: 75,
      status: "completed",
    },
    {
      id: 2,
      mentor: "Michael Chen",
      mentee: "Priya Patel",
      topic: "Machine Learning Project Review",
      date: "2024-01-15",
      duration: "45 min",
      amount: 85,
      status: "completed",
    },
    {
      id: 3,
      mentor: "Emily Rodriguez",
      mentee: "Marcus Johnson",
      topic: "Portfolio Design Feedback",
      date: "2024-01-14",
      duration: "30 min",
      amount: 65,
      status: "completed",
    },
  ]

  const handleApprove = (mentorId: number) => {
    console.log(`Approving mentor ${mentorId}`)
    // Handle approval logic
  }

  const handleReject = (mentorId: number) => {
    console.log(`Rejecting mentor ${mentorId}`)
    // Handle rejection logic
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFFEEC] via-white to-[#FFFFEEC]">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#CBD83B] to-[#A88AED] rounded-xl flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-[#CBD83B] to-[#A88AED] bg-clip-text text-transparent">
              PeerUP Admin
            </span>
          </Link>
          <div className="flex items-center space-x-4">
            <Badge className="bg-red-100 text-red-700">
              <Shield className="w-3 h-3 mr-1" />
              Admin Access
            </Badge>
            <Avatar className="w-8 h-8">
              <AvatarImage src="/placeholder.svg?height=32&width=32" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-xl text-gray-600">Manage mentors, monitor sessions, and track platform growth</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 rounded-2xl bg-gray-100 p-1">
            <TabsTrigger value="overview" className="rounded-xl">
              Overview
            </TabsTrigger>
            <TabsTrigger value="mentors" className="rounded-xl">
              Mentor Applications
            </TabsTrigger>
            <TabsTrigger value="sessions" className="rounded-xl">
              Sessions
            </TabsTrigger>
            <TabsTrigger value="payments" className="rounded-xl">
              Payments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-5 gap-6">
              <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-br from-[#CBD83B]/20 to-[#CBD83B]/5">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
                    </div>
                    <Users className="w-8 h-8 text-[#CBD83B]" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-br from-[#A88AED]/20 to-[#A88AED]/5">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Active Mentors</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.activeMentors}</p>
                    </div>
                    <GraduationCap className="w-8 h-8 text-[#A88AED]" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Pending Applications</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.pendingApplications}</p>
                    </div>
                    <Clock className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString()}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Monthly Growth</p>
                      <p className="text-2xl font-bold text-gray-900">+{stats.monthlyGrowth}%</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg rounded-3xl">
                <CardHeader>
                  <CardTitle>Recent Sessions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentSessions.slice(0, 5).map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50">
                      <div>
                        <p className="font-medium text-gray-900">
                          {session.mentor} → {session.mentee}
                        </p>
                        <p className="text-sm text-gray-600">{session.topic}</p>
                        <p className="text-xs text-gray-500">
                          {session.date} • {session.duration}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">${session.amount}</p>
                        <Badge variant="secondary" className="text-xs">
                          {session.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg rounded-3xl">
                <CardHeader>
                  <CardTitle>Platform Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Session Completion Rate</span>
                      <span className="font-bold text-green-600">94%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Average Session Rating</span>
                      <span className="font-bold text-yellow-600">4.8/5</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Mentor Response Time</span>
                      <span className="font-bold text-blue-600">Less than 3 hours</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">User Retention (30d)</span>
                      <span className="font-bold text-purple-600">78%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="mentors" className="space-y-6">
            <Card className="border-0 shadow-lg rounded-3xl">
              <CardHeader>
                <CardTitle>Pending Mentor Applications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {pendingMentors.map((mentor) => (
                  <div key={mentor.id} className="border border-gray-200 rounded-2xl p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{mentor.name}</h3>
                            <p className="text-gray-600">
                              {mentor.title} at {mentor.company}
                            </p>
                            <p className="text-sm text-gray-500">{mentor.experience} experience</p>
                          </div>
                          <Badge variant="outline" className="text-orange-600 border-orange-200">
                            Pending Review
                          </Badge>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-2">Expertise:</p>
                          <div className="flex flex-wrap gap-2">
                            {mentor.expertise.map((skill, index) => (
                              <Badge key={index} variant="secondary" className="bg-[#A88AED]/20 text-[#A88AED]">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center space-x-1">
                            <Mail className="w-4 h-4" />
                            <span>{mentor.email}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>Applied {mentor.appliedDate}</span>
                          </div>
                        </div>
                      </div>

                      <div className="lg:w-64 space-y-3">
                        <Button variant="outline" className="w-full rounded-xl bg-transparent">
                          <FileText className="w-4 h-4 mr-2" />
                          View Resume
                        </Button>
                        <Button variant="outline" className="w-full rounded-xl bg-transparent">
                          <Phone className="w-4 h-4 mr-2" />
                          Schedule Call
                        </Button>
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleApprove(mentor.id)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleReject(mentor.id)}
                            variant="outline"
                            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 rounded-xl"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <Card className="border-0 shadow-lg rounded-3xl">
              <CardHeader>
                <CardTitle>All Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-medium text-gray-900">{session.mentor}</p>
                          <p className="text-sm text-gray-600">with {session.mentee}</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-gray-900">{session.topic}</p>
                        <p className="text-sm text-gray-600">{session.date}</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-gray-900">{session.duration}</p>
                        <p className="text-sm text-green-600 font-medium">${session.amount}</p>
                      </div>
                      <Badge
                        variant={session.status === "completed" ? "default" : "secondary"}
                        className={session.status === "completed" ? "bg-green-100 text-green-700" : ""}
                      >
                        {session.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-0 shadow-lg rounded-2xl">
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString()}</p>
                    <p className="text-sm text-green-600">+12% from last month</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg rounded-2xl">
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Pending Payouts</p>
                    <p className="text-3xl font-bold text-gray-900">$8,450</p>
                    <p className="text-sm text-orange-600">23 mentors</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg rounded-2xl">
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Platform Fee</p>
                    <p className="text-3xl font-bold text-gray-900">$4,567</p>
                    <p className="text-sm text-blue-600">10% commission</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-lg rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Payment History
                  <Button variant="outline" className="rounded-xl bg-transparent">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50">
                      <div>
                        <p className="font-medium text-gray-900">{session.mentor}</p>
                        <p className="text-sm text-gray-600">
                          {session.date} • {session.duration}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">${session.amount}</p>
                        <p className="text-sm text-gray-600">Platform fee: ${(session.amount * 0.1).toFixed(2)}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-700">Paid</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
