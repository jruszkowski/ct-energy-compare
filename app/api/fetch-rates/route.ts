import { NextResponse } from 'next/server'
import { buildCandidateUrls, parseOCCText, buildSupplierList } from '@/lib/occ-parser'

export const runtime = 'nodejs'
export const maxDuration = 30

const FALLBACK_DATA = {
  suppliers: [] as any[],
  stdRateEversource: 12.64,
  stdRateUI: 13.695,
  nextRateEversource: null,
  nextRateUI: null,
  nextPeriod: null,
  stdPeriod: 'Jan 1 – Jun 30, 2026',
  pubDate: null,
  dataMonth: null,
  sourceUrl: null,
}

async function fetchPDF(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return null

    const buffer = await res.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')

    // Use raw fetch to Anthropic API — avoids SDK TypeScript type issues
    // with the 'document' content block which older SDK versions don't type
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: base64 }
            },
            {
              type: 'text',
              text: 'Extract ALL text from this PDF exactly as written. Return only the raw text, no commentary.'
            }
          ]
        }]
      })
    })

    if (!anthropicRes.ok) return null
    const data = await anthropicRes.json()
    const textBlock = data.content?.find((b: any) => b.type === 'text')
    return textBlock?.text ?? null
  } catch {
    return null
  }
}

export async function GET() {
  const urls = buildCandidateUrls()
  let text: string | null = null
  let usedUrl: string | null = null

  for (const url of urls) {
    text = await fetchPDF(url)
    if (text && text.length > 300) {
      usedUrl = url
      break
    }
  }

  if (!text) {
    return NextResponse.json({
      occData: FALLBACK_DATA,
      suppliers: {
        eversource: buildSupplierList(FALLBACK_DATA, 'eversource'),
        ui: buildSupplierList(FALLBACK_DATA, 'ui'),
      },
      fromCache: false,
      fallback: true,
    })
  }

  const occData = parseOCCText(text)
  occData.sourceUrl = usedUrl

  return NextResponse.json({
    occData,
    suppliers: {
      eversource: buildSupplierList(occData, 'eversource'),
      ui: buildSupplierList(occData, 'ui'),
    },
    fromCache: false,
    fallback: false,
  })
}
