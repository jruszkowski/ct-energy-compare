import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildCandidateUrls, parseOCCText, buildSupplierList } from '@/lib/occ-parser'

export const runtime = 'nodejs'
export const maxDuration = 30

async function fetchPDF(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    // Use Anthropic to extract text from PDF bytes
    const buffer = await res.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')

    const client = new Anthropic()
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document' as const,
            source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: base64 }
          } as any,
          {
            type: 'text' as const,
            text: 'Extract ALL text from this PDF exactly as written. Return only the raw text, no commentary.'
          }
        ]
      }]
    })

    const textBlock = msg.content.find(b => b.type === 'text')
    return textBlock && 'text' in textBlock ? textBlock.text : null
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
    // Fallback: hardcoded last-known data
    return NextResponse.json({
      occData: {
        stdRateEversource: 12.64,
        stdRateUI: 13.695,
        nextRateEversource: null,
        nextRateUI: null,
        nextPeriod: null,
        stdPeriod: 'Jan 1 – Jun 30, 2026',
        pubDate: null,
        dataMonth: null,
        sourceUrl: null,
        suppliers: [],
      },
      suppliers: {
        eversource: buildSupplierList({
          suppliers: [], stdRateEversource: 12.64, stdRateUI: 13.695,
          nextRateEversource: null, nextRateUI: null, nextPeriod: null,
          stdPeriod: 'Jan 1 – Jun 30, 2026', pubDate: null, dataMonth: null, sourceUrl: null
        }, 'eversource'),
        ui: buildSupplierList({
          suppliers: [], stdRateEversource: 12.64, stdRateUI: 13.695,
          nextRateEversource: null, nextRateUI: null, nextPeriod: null,
          stdPeriod: 'Jan 1 – Jun 30, 2026', pubDate: null, dataMonth: null, sourceUrl: null
        }, 'ui'),
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
