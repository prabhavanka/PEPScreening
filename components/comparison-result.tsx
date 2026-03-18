"use client"

import { useMemo } from "react"

import type { ComparisonResponse } from "@/lib/openai"

interface ComparisonResultProps {
  result: ComparisonResponse
  company1: string
  company2: string
}

function parseMarkdownLine(line: string): React.ReactNode {
  // Bold
  const parts: React.ReactNode[] = []
  const boldRegex = /\*\*(.*?)\*\*/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = boldRegex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(line.slice(lastIndex, match.index))
    }
    parts.push(
      <strong key={match.index} className="font-semibold text-foreground">
        {match[1]}
      </strong>
    )
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < line.length) {
    parts.push(line.slice(lastIndex))
  }

  return parts.length > 0 ? parts : line
}

function MarkdownRenderer({ content }: { content: string }) {
  const elements = useMemo(() => {
    const lines = content.split("\n")
    const result: React.ReactNode[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // H2 headings
      if (line.startsWith("## ")) {
        result.push(
          <h2
            key={i}
            className="mt-8 mb-4 text-xl font-bold text-primary first:mt-0"
          >
            {line.slice(3)}
          </h2>
        )
        continue
      }

      // H3 headings
      if (line.startsWith("### ")) {
        result.push(
          <h3 key={i} className="mt-6 mb-3 text-lg font-semibold text-foreground">
            {line.slice(4)}
          </h3>
        )
        continue
      }

      // Bullet points
      if (line.startsWith("- ") || line.startsWith("* ")) {
        result.push(
          <li
            key={i}
            className="ml-4 mb-1.5 list-disc text-muted-foreground leading-relaxed"
          >
            {parseMarkdownLine(line.slice(2))}
          </li>
        )
        continue
      }

      // Horizontal rule
      if (line === "---" || line === "***") {
        result.push(
          <hr key={i} className="my-6 border-border" />
        )
        continue
      }

      // Empty lines
      if (line.trim() === "") {
        result.push(<div key={i} className="h-2" />)
        continue
      }

      // Regular paragraph
      result.push(
        <p key={i} className="mb-2 text-muted-foreground leading-relaxed">
          {parseMarkdownLine(line)}
        </p>
      )
    }

    return result
  }, [content])

  return <div className="space-y-0">{elements}</div>
}

export function ComparisonResult({
  result,
  company1,
  company2,
}: ComparisonResultProps) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">
          {company1}{" "}
          <span className="text-primary">vs</span>{" "}
          {company2}
        </h2>
        {result.usage && (
          <span className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
            {result.usage.total_tokens} tokens used
          </span>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-6 md:p-8">
        <MarkdownRenderer content={result.content} />
      </div>
    </div>
  )
}
