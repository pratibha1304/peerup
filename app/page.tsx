"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import GoogleSignInButton from "@/components/GoogleSignInButton"
import { ArrowRight, CheckCircle2, Heart, MessageSquare, Sparkles, Target, Users } from "lucide-react"

const highlights = [
  {
    icon: Target,
    title: "Goals, broken down",
    description: "Tell us the goal, Vertex AI turns it into a sequence of doable tasks with day estimates.",
  },
  {
    icon: MessageSquare,
    title: "Live accountability",
    description: "Dashboards surface missed calls, unread chats, and pending requests so nothing slips.",
  },
  {
    icon: Users,
    title: "Mentors + buddies",
    description: "Get paired with mentors or peers who match your pace, stack, and availability.",
  },
]

const steps = [
  { title: "Set a clear goal", detail: "Define the outcome and how fast you want to move." },
  { title: "Get your match", detail: "We connect you with a mentor, buddy, or both." },
  { title: "Unlock tasks", detail: "Every task opens only after both partners check in." },
  { title: "Track the signal", detail: "Dynamic dashboards keep the next action on top." },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-heading font-bold">PeerUp</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/auth/signin">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="gap-2">
                Join now
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="overflow-hidden">
        <section className="py-24 px-4">
          <div className="container mx-auto max-w-5xl text-center">
            <Badge className="mb-6 gap-2 px-4 py-1.5 text-sm">
              <Sparkles className="h-4 w-4" />
              Paired focus for ambitious students
            </Badge>
            <h1 className="text-4xl md:text-6xl font-heading font-bold leading-tight mb-6">
              Match. Learn. Repeat.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Stop networking. Start conspiring.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Link href="/auth/signup">
                <Button size="lg" className="px-8 py-6 text-base">
                  Get started
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <div className="max-w-xs mx-auto sm:mx-0">
                <GoogleSignInButton />
              </div>
            </div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              No fluff dashboards • Vertex AI tasks • Real partners
            </p>
          </div>
        </section>

        <section className="py-16 px-4 border-t">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-3 gap-6">
              {highlights.map((item) => (
                <Card key={item.title} className="rounded-3xl border shadow-lg bg-card/60">
                  <CardContent className="p-6 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-5xl grid lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <p className="text-sm uppercase tracking-wider text-primary">How it works</p>
              <h2 className="text-3xl md:text-4xl font-heading font-bold">
                A simple flow that keeps both partners honest.
              </h2>
              <ul className="space-y-4">
                {steps.map((step, index) => (
                  <li key={step.title} className="flex gap-4">
                    <div className="text-base font-bold text-primary/80">{String(index + 1).padStart(2, "0")}</div>
                    <div>
                      <p className="font-semibold">{step.title}</p>
                      <p className="text-sm text-muted-foreground">{step.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <Card className="rounded-3xl border shadow-xl bg-gradient-to-br from-primary/10 via-background to-accent/10 p-8">
              <div className="space-y-5">
                <h3 className="text-xl font-semibold">Live dashboard snapshot</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex items-center justify-between rounded-2xl bg-white/80 dark:bg-neutral-900/60 px-4 py-3">
                    <span>Missed calls this week</span>
                    <strong>1</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-white/80 dark:bg-neutral-900/60 px-4 py-3">
                    <span>Tasks waiting on partner</span>
                    <strong>2</strong>
                  </div>
                  <div className="rounded-2xl bg-white/80 dark:bg-neutral-900/60 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Current goal</p>
                    <div className="flex items-center justify-between">
                      <strong>Launch prototype</strong>
                      <span className="text-primary font-semibold">56%</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: "56%" }} />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Every card updates in real-time from Firestore. No guessing where to focus next.
                </p>
              </div>
            </Card>
          </div>
        </section>

        <section className="py-16 px-4 bg-muted/40">
          <div className="container mx-auto max-w-4xl text-center space-y-8">
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Signal driven</p>
            <h2 className="text-3xl md:text-4xl font-heading font-bold">
              Built for students who want momentum, not more tabs.
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              {[
                "Dynamic dashboards for each role",
                "AI task plans with day estimates",
                "Mutual checkboxes to unlock the next step",
              ].map((line) => (
                <div key={line} className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <p className="text-sm text-muted-foreground">{line}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="px-8">
                  Create my account
                </Button>
              </Link>
              <Link href="/auth/signin" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
                Already have one? Sign in →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-10 px-4 border-t">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div>© {new Date().getFullYear()} PeerUp. All rights reserved.</div>
          <div className="flex gap-6">
            <Link href="#">Privacy</Link>
            <Link href="#">Terms</Link>
            <Link href="#">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
