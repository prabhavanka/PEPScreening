export interface ComparisonRequest {
  company1: string
  company2: string
  apiKey: string
}

export interface ComparisonResponse {
  content: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

const SYSTEM_PROMPT = `You are a business analyst expert. When given two company names, provide a detailed and structured comparison. Format your response using the following sections with clear markdown:

## Overview
Brief description of both companies.

## Market Position
Compare their market positions, market share, and industry standing.

## Products & Services
Compare their core offerings.

## Financial Performance
Compare revenue, growth trajectory, and financial health (based on public knowledge).

## Strengths & Weaknesses
A balanced view of each company's strengths and weaknesses.

## Verdict
A brief concluding summary of how they stack up against each other.

Keep the analysis factual, balanced, and insightful. Use concise bullet points where appropriate.`

export async function compareCompanies({
  company1,
  company2,
  apiKey,
}: ComparisonRequest): Promise<ComparisonResponse> {
  const userMessage = `Compare these two companies in detail: "${company1}" vs "${company2}"`

  const requestBody = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  }

  console.log("[v0] Sending request to OpenAI API:", {
    model: requestBody.model,
    messages: requestBody.messages.map((m) => ({
      role: m.role,
      content: m.content.substring(0, 100) + (m.content.length > 100 ? "..." : ""),
    })),
    temperature: requestBody.temperature,
    max_tokens: requestBody.max_tokens,
  })

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    console.log("[v0] OpenAI API error response:", {
      status: response.status,
      statusText: response.statusText,
      error: errorData,
    })
    const message =
      errorData?.error?.message ||
      `API request failed with status ${response.status}`
    throw new Error(message)
  }

  const data = await response.json()

  console.log("[v0] OpenAI API response received:", {
    id: data.id,
    model: data.model,
    usage: data.usage,
    contentLength: data.choices?.[0]?.message?.content?.length,
    finishReason: data.choices?.[0]?.finish_reason,
  })

  return {
    content: data.choices[0].message.content,
    usage: data.usage,
  }
}
