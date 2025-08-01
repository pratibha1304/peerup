"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Target, MessageCircle, Star, ArrowRight, Zap, Heart, Sparkles } from "lucide-react"
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { ThemeToggle } from "@/components/ui/theme-toggle";

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
      description: "Mentors who don't sound like your dad. Real advice, real progress.",
      badge: "Premium",
      color: "bg-gradient-to-br from-accent/20 to-accent/5",
    },
    {
      icon: MessageCircle,
      title: "Goal Tracking",
      description: "Set goals, track progress, and pretend you have it all together. (We won't tell.)",
      badge: "AI-Powered",
      color: "bg-gradient-to-br from-secondary/20 to-secondary/10",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-primary/20 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-heading font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              PeerUP
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Link href="/auth/signin">
              <Button variant="ghost" className="text-foreground hover:text-primary font-medium">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg hover:shadow-xl transition-all duration-300">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge className="mb-8 bg-gradient-to-r from-primary/20 to-accent/20 text-foreground border-0 px-4 py-2 rounded-full">
            <Sparkles className="w-4 h-4 mr-2" />
            Connecting Students Worldwide
          </Badge>
          <h1 className="text-5xl md:text-7xl font-heading font-bold mb-8 bg-gradient-to-r from-foreground via-accent to-foreground bg-clip-text text-transparent leading-tight animate-fade-in-up">
            Lost? Confused? Want to delete LinkedIn every Monday? Same.
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up">
            PeerUp is for the ambitious, the burnt-out, and everyone in between. Find your people, get real advice, and finally feel like you belong (even if you're a little bit of a mess).
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6 animate-fade-in-up">
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-8 py-6 text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                Start Your Journey
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
          <div className="max-w-xs mx-auto animate-fade-in-up">
            <GoogleSignInButton />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-card/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-heading font-bold mb-4 text-foreground">What's Inside?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Not your average mentorship app. We're here for the chaos, the growth, and the memes.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className={`${feature.color} border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 rounded-3xl overflow-hidden group`}
              >
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <feature.icon className="w-7 h-7 text-primary" />
                    </div>
                    <Badge variant="secondary" className="bg-white/90 text-foreground font-medium">
                      {feature.badge}
                    </Badge>
                  </div>
                  <h3 className="text-2xl font-heading font-bold mb-4 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
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
            <div className="animate-fade-in-up">
              <div className="text-4xl font-heading font-bold text-primary mb-2">2,500+</div>
              <div className="text-muted-foreground">Active Students</div>
            </div>
            <div className="animate-fade-in-up">
              <div className="text-4xl font-heading font-bold text-accent mb-2">150+</div>
              <div className="text-muted-foreground">Verified Mentors</div>
            </div>
            <div className="animate-fade-in-up">
              <div className="text-4xl font-heading font-bold text-secondary mb-2">89%</div>
              <div className="text-muted-foreground">Goal Achievement Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-heading font-bold mb-4 text-foreground">What Students Say</h2>
            <p className="text-xl text-muted-foreground">Real stories from our community</p>
          </div>
          <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-card">
            <CardContent className="p-12">
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 fill-primary text-primary mx-1" />
                  ))}
                </div>
                <blockquote className="text-2xl text-foreground mb-8 leading-relaxed font-medium">
                  "{testimonials[currentTestimonial].content}"
                </blockquote>
                <div>
                  <div className="font-heading font-bold text-foreground text-lg">{testimonials[currentTestimonial].name}</div>
                  <div className="text-muted-foreground">{testimonials[currentTestimonial].role}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-center mt-8 space-x-3">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  index === currentTestimonial ? "bg-primary scale-125" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-gradient-to-br from-primary to-accent">
            <CardContent className="p-12">
              <h2 className="text-4xl font-heading font-bold mb-4 text-primary-foreground">Ready to Transform Your Learning Journey?</h2>
              <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
                Join thousands of students who are achieving their goals with the right support system
              </p>
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="bg-white text-foreground hover:bg-gray-100 font-medium px-8 py-6 text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
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
      <footer className="bg-foreground text-primary-foreground py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-heading font-bold">PeerUP</span>
              </div>
              <p className="text-muted-foreground">
                Connecting students with the right mentors and peers to achieve their goals.
              </p>
            </div>
            <div>
              <h3 className="font-heading font-bold mb-4">Platform</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-primary-foreground transition-colors">
                    Find Buddies
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary-foreground transition-colors">
                    Find Mentors
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary-foreground transition-colors">
                    Goal Tracking
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-heading font-bold mb-4">Support</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-primary-foreground transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary-foreground transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary-foreground transition-colors">
                    Community
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-heading font-bold mb-4">Legal</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-primary-foreground transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary-foreground transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary-foreground transition-colors">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-muted-foreground/20 mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 PeerUP. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
