"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Target, MessageCircle, Star, ArrowRight, Zap, Heart } from "lucide-react"
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default function LandingPage() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0)

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Computer Science Student",
      content:
        "PeerUP helped me find the perfect study buddy for my coding journey. We've been consistent for 3 months now!",
      rating: 5,
    },
    {
      name: "Rahul Sharma",
      role: "Business Student",
      content: "My mentor on PeerUP guided me through my startup idea. The monthly check-ins kept me accountable.",
      rating: 5,
    },
    {
      name: "Emily Johnson",
      role: "Design Student",
      content: "Finally found someone who shares my design goals. We motivate each other every day!",
      rating: 5,
    },
  ]

  const features = [
    {
      icon: Users,
      title: "Find your Growth Buddy",
      description: "Because suffering alone is so 2020. Get matched with someone who actually gets it.",
      badge: "Free",
      color: "bg-gradient-to-br from-primary/20 to-primary/5",
    },
    {
      icon: Target,
      title: "Mentor Match",
      description: "Mentors who don’t sound like your dad. Real advice, real progress.",
      badge: "Premium",
      color: "bg-gradient-to-br from-accent/20 to-accent/5",
    },
    {
      icon: MessageCircle,
      title: "Goal Tracking",
      description: "Set goals, track progress, and pretend you have it all together. (We won’t tell.)",
      badge: "AI-Powered",
      color: "bg-gradient-to-br from-primary/10 to-accent/10",
    },
    {
      icon: Star,
      title: "Swipe, Match, Meet",
      description: "No awkward icebreakers. Just vibes, skills, and a little bit of chaos.",
      badge: "Social",
      color: "bg-gradient-to-br from-secondary/20 to-primary/10",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFFEEC] via-white to-[#FFFFEEC]">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#CBD83B] to-[#A88AED] rounded-xl flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-[#CBD83B] to-[#A88AED] bg-clip-text text-transparent">
              PeerUP
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/auth/signin">
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-[#CBD83B] hover:bg-[#CBD83B]/90 text-black font-medium">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge className="mb-6 bg-gradient-to-r from-primary/20 to-accent/20 text-gray-700 border-0">
            <Zap className="w-3 h-3 mr-1" />
            Connecting Students Worldwide
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent leading-tight">
            Lost? Confused? Want to delete LinkedIn every Monday? Same.
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            PeerUp is for the ambitious, the burnt-out, and everyone in between. Find your people, get real advice, and finally feel like you belong (even if you’re a little bit of a mess).
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-black font-medium px-8 py-6 text-lg rounded-2xl"
              >
                Start Your Journey
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
          <div className="max-w-xs mx-auto">
            <GoogleSignInButton />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">What’s Inside?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Not your average mentorship app. We’re here for the chaos, the growth, and the memes.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className={`${feature.color} border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 rounded-3xl overflow-hidden`}
              >
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                      <feature.icon className="w-6 h-6 text-gray-700" />
                    </div>
                    <Badge variant="secondary" className="bg-white/80 text-gray-700">
                      {feature.badge}
                    </Badge>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-[#CBD83B] mb-2">2,500+</div>
              <div className="text-gray-600">Active Students</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#A88AED] mb-2">150+</div>
              <div className="text-gray-600">Verified Mentors</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900 mb-2">89%</div>
              <div className="text-gray-600">Goal Achievement Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-gradient-to-r from-[#CBD83B]/5 to-[#A88AED]/5">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">What Students Say</h2>
            <p className="text-xl text-gray-600">Real stories from our community</p>
          </div>
          <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white">
            <CardContent className="p-12">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-[#CBD83B] text-[#CBD83B]" />
                  ))}
                </div>
                <blockquote className="text-2xl text-gray-700 mb-6 leading-relaxed">
                  "{testimonials[currentTestimonial].content}"
                </blockquote>
                <div>
                  <div className="font-bold text-gray-900 text-lg">{testimonials[currentTestimonial].name}</div>
                  <div className="text-gray-600">{testimonials[currentTestimonial].role}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-center mt-8 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentTestimonial ? "bg-[#CBD83B]" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-gradient-to-br from-[#CBD83B] to-[#A88AED]">
            <CardContent className="p-12">
              <h2 className="text-4xl font-bold mb-4 text-white">Ready to Transform Your Learning Journey?</h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join thousands of students who are achieving their goals with the right support system
              </p>
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="bg-white text-gray-900 hover:bg-gray-100 font-medium px-8 py-6 text-lg rounded-2xl"
                >
                  Get Started for Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-[#CBD83B] to-[#A88AED] rounded-xl flex items-center justify-center">
                  <Heart className="w-4 h-4 text-white" />
                </div>
                <span className="text-2xl font-bold">PeerUP</span>
              </div>
              <p className="text-gray-400">
                Connecting students with the right mentors and peers to achieve their goals.
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    Find Buddies
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Find Mentors
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Goal Tracking
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Community
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 PeerUP. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
