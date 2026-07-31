import { NextRequest, NextResponse } from 'next/server'

// Hardcoded production webhook URL
const WEBHOOK_URL = 'https://vek-kmr.app.n8n.cloud/webhook/400b8307-88a2-407a-9494-921fb00f51cd'

export async function POST(request: NextRequest) {
  const webhookUrl = WEBHOOK_URL

  console.log('[v0] Using hardcoded webhook URL:', webhookUrl)

  try {
    const payload = await request.json()

    console.log('[v0] Proxying screening request to n8n:', {
      url: webhookUrl,
      payload,
    })

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    console.log('[v0] n8n response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[v0] n8n error body:', errorText)
      return NextResponse.json(
        { error: `n8n returned status ${response.status}: ${errorText}`, _webhookUrl: webhookUrl },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('[v0] n8n raw response:', JSON.stringify(data, null, 2))

    // Include the webhook URL in the response for debugging
    return NextResponse.json({ data, _webhookUrl: webhookUrl })
  } catch (error) {
    console.error('[v0] Proxy request failed:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to reach n8n webhook',
        _webhookUrl: webhookUrl,
      },
      { status: 502 }
    )
  }
}
