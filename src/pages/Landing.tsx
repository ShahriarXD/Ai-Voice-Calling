import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap, Phone, Bot, BarChart3, Clock, Shield, ArrowRight, Check } from "lucide-react";

const features = [
  { icon: Bot, title: "AI Voice Agents", desc: "Create intelligent agents that handle calls naturally." },
  { icon: Phone, title: "24/7 Availability", desc: "Never miss a call. Your AI agent is always on." },
  { icon: BarChart3, title: "Real-Time Analytics", desc: "Track call volume, duration, and outcomes." },
  { icon: Clock, title: "Instant Setup", desc: "Go live in minutes, not weeks." },
  { icon: Shield, title: "Enterprise Security", desc: "SOC 2 compliant infrastructure." },
  { icon: Zap, title: "Smart Routing", desc: "Route calls based on intent and urgency." },
];

const useCases = [
  { title: "Appointment Booking", desc: "Let AI schedule, reschedule, and confirm appointments automatically." },
  { title: "Lead Qualification", desc: "Qualify inbound leads with custom questions before routing to sales." },
  { title: "Customer Support", desc: "Handle FAQs, order status, and basic troubleshooting 24/7." },
];

const pricing = [
  { name: "Starter", price: "$29", period: "/mo", features: ["1 AI Agent", "500 minutes/mo", "Basic analytics", "Email support"], cta: "Start Free Trial" },
  { name: "Pro", price: "$99", period: "/mo", features: ["5 AI Agents", "5,000 minutes/mo", "Advanced analytics", "Priority support", "Custom voices"], cta: "Start Free Trial", popular: true },
  { name: "Enterprise", price: "Custom", period: "", features: ["Unlimited agents", "Unlimited minutes", "Dedicated account manager", "SLA guarantee", "API access"], cta: "Contact Sales" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <span className="font-display text-xl font-bold">VoiceAI</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#use-cases" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Use Cases</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
        <div className="relative mx-auto max-w-7xl px-6 text-center">
          <div className="mx-auto max-w-3xl animate-fade-in">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground">
              <Zap className="h-3.5 w-3.5" /> Now in Public Beta
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              AI Voice Agents That Answer Your Business Calls{" "}
              <span className="text-primary">24/7</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
              Automate appointments, support, and sales calls with AI.
              Deploy intelligent voice agents in minutes.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link to="/signup">
                <Button size="lg" className="gap-2 px-8">
                  Start Free Trial <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline" className="px-8">
                  See How It Works
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Everything You Need</h2>
            <p className="mt-4 text-muted-foreground text-lg">Powerful tools to automate your phone operations.</p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="bg-muted/50 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Built For Your Industry</h2>
            <p className="mt-4 text-muted-foreground text-lg">See how businesses use AI voice agents.</p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {useCases.map((uc) => (
              <div key={uc.title} className="rounded-xl border border-border bg-card p-8">
                <h3 className="font-display text-xl font-semibold">{uc.title}</h3>
                <p className="mt-3 text-muted-foreground">{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-muted-foreground text-lg">Start free. Scale as you grow.</p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-xl border p-8 ${
                  plan.popular
                    ? "border-primary bg-card shadow-xl shadow-primary/10"
                    : "border-border bg-card"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                    Most Popular
                  </div>
                )}
                <h3 className="font-display text-xl font-semibold">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="mt-8 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/signup" className="mt-8 block">
                  <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-muted/50 py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Ready to Automate Your Calls?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join hundreds of businesses using AI voice agents. Start your free trial today.
          </p>
          <Link to="/signup">
            <Button size="lg" className="mt-8 gap-2 px-8">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-muted-foreground">
          © 2026 VoiceAI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
