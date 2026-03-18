import { Zap } from "lucide-react"

export function Header() {
  return (
    <header className="flex flex-col items-center gap-4 text-center">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary">
          <Zap className="size-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold tracking-tight text-foreground">
          CompareAI
        </span>
      </div>
      <div className="flex max-w-2xl flex-col gap-3">
        <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          AI-Powered Company Comparison
        </h1>
        <p className="text-pretty text-lg text-muted-foreground leading-relaxed">
          Enter two company names and your OpenAI API key to get an instant,
          detailed analysis powered by GPT-4o-mini.
        </p>
      </div>
    </header>
  )
}
