import { Lock, Cpu, Clock } from "lucide-react"

const features = [
  {
    icon: Cpu,
    title: "GPT-4o-mini",
    description: "Powered by OpenAI's efficient and capable model",
  },
  {
    icon: Lock,
    title: "Private & Secure",
    description: "Your API key stays in your browser, never on our servers",
  },
  {
    icon: Clock,
    title: "Instant Analysis",
    description: "Get a detailed comparison in seconds, not hours",
  },
]

export function FeaturePills() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      {features.map((feature) => (
        <div
          key={feature.title}
          className="flex items-center gap-3 rounded-full border border-border bg-secondary/50 px-4 py-2"
        >
          <feature.icon className="size-4 text-primary" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">
              {feature.title}
            </span>
            <span className="text-xs text-muted-foreground">
              {feature.description}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
