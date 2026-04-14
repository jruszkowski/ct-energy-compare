export const MONTHS = [
  'january','february','march','april','may','june',
  'july','august','september','october','november','december'
]

export interface Supplier {
  name: string
  rate: number
  termCycles: number
  type: 'fixed' | 'variable'
  isStandard: boolean
  isNext: boolean
  termLabel: string
}

export interface OCCData {
  suppliers: Supplier[]
  stdRateEversource: number | null
  stdRateUI: number | null
  nextRateEversource: number | null
  nextRateUI: number | null
  nextPeriod: string | null
  stdPeriod: string | null
  pubDate: string | null
  dataMonth: string | null
  sourceUrl: string | null
}

export function buildCandidateUrls(): string[] {
  const now = new Date()
  const urls: string[] = []
  for (let lag = 1; lag <= 6; lag++) {
    const pubDate = new Date(now.getFullYear(), now.getMonth() - lag + 1, 1)
    const dataDate = new Date(now.getFullYear(), now.getMonth() - lag - 1, 1)
    const pubMonth = MONTHS[pubDate.getMonth()]
    const pubYear = pubDate.getFullYear()
    const dataMonth = MONTHS[dataDate.getMonth()]
    const dataYear = dataDate.getFullYear()
    urls.push(
      `https://portal.ct.gov/-/media/occ/supplier-fact-sheets/${pubYear}/${pubMonth}-${pubYear}-fact-sheet-electric-supplier-market-${dataMonth}-${dataYear}.pdf`,
      `https://portal.ct.gov/-/media/occ/fact-sheet-electric-supplier-market-${pubMonth}-${pubYear}.pdf`
    )
  }
  return urls
}

export function parseOCCText(text: string): OCCData {
  const result: OCCData = {
    suppliers: [],
    stdRateEversource: null,
    stdRateUI: null,
    nextRateEversource: null,
    nextRateUI: null,
    nextPeriod: null,
    stdPeriod: null,
    pubDate: null,
    dataMonth: null,
    sourceUrl: null,
  }

  // Publication date
  const pubMatch = text.match(/Updated on\s+([\w]+ \d+,?\s*\d{4})/i)
  if (pubMatch) result.pubDate = pubMatch[1].trim()

  // Data month range
  const dataMatch = text.match(/ELECTRIC SUPPLIER MARKET,?\s+\w+ \d{4}\s+THROUGH\s+(\w+ \d{4})/i)
  if (dataMatch) result.dataMonth = dataMatch[1]

  // Current standard service rates — look for the table row pattern "Eversource – X cents/kWh"
  const evsStdMatch = text.match(/Eversource\s*[–\-]\s*(\d+\.?\d*)\s*cents\/kWh/i)
  if (evsStdMatch) result.stdRateEversource = parseFloat(evsStdMatch[1])

  const uiStdMatch = text.match(/United Illuminating\s*[–\-]\s*(\d+\.?\d*)\s*cents\/kWh/i)
  if (uiStdMatch) result.stdRateUI = parseFloat(uiStdMatch[1])

  // Also try "Standard Offer is/was X cents" pattern
  const evsNarrMatch = text.match(/Eversource standard offer(?:[^.]*?)(?:is|will be|was)\s+(\d+\.?\d*)\s*cents\/kWh/i)
  if (evsNarrMatch && !result.stdRateEversource) result.stdRateEversource = parseFloat(evsNarrMatch[1])

  const uiNarrMatch = text.match(/UI standard offer(?:[^.]*?)(?:is|will be|was)\s+(\d+\.?\d*)\s*cents\/kWh/i)
  if (uiNarrMatch && !result.stdRateUI) result.stdRateUI = parseFloat(uiNarrMatch[1])

  // Next/upcoming rates
  const evsNextMatch = text.match(/upcoming\s+Eversource\s+standard offer(?:[^.]*?)(\d+\.?\d*)\s*cents\/kWh/i)
  if (evsNextMatch) result.nextRateEversource = parseFloat(evsNextMatch[1])

  const uiNextMatch = text.match(/upcoming\s+UI\s+standard offer(?:[^.]*?)(\d+\.?\d*)\s*cents\/kWh/i)
  if (uiNextMatch) result.nextRateUI = parseFloat(uiNextMatch[1])

  // Next period label
  const nextPeriodMatch = text.match(/upcoming.*?((?:January|July)\s+1,?\s+\d{4}\s+(?:to|through)\s+(?:June|December)\s+\d+,?\s+\d{4})/i)
  if (nextPeriodMatch) result.nextPeriod = nextPeriodMatch[1]

  // Std period label
  const stdPeriodMatch = text.match(/((?:January|July)\s+1,?\s+\d{4}\s+(?:to|through)\s+(?:June|December)\s+\d+,?\s+\d{4})/i)
  if (stdPeriodMatch) result.stdPeriod = stdPeriodMatch[1]

  // Parse supplier rows — "Name – X.XX cents/kWh for N billing cycles"
  const supplierRe = /([A-Z][A-Za-z\s&.']+?)\s*[–\-]\s*(\d+\.?\d*)\s*cents?\/kWh\s+(?:for\s+)?(\d+)\s+billing/g
  let m: RegExpExecArray | null
  while ((m = supplierRe.exec(text)) !== null) {
    const name = m[1].trim().replace(/\s+/g, ' ')
    const rate = parseFloat(m[2])
    const cycles = parseInt(m[3])
    if (!isNaN(rate) && name.length > 2 && !name.match(/^(Eversource|United Illuminating|UI)$/i)) {
      result.suppliers.push({
        name, rate, termCycles: cycles, type: 'fixed',
        isStandard: false, isNext: false,
        termLabel: `${cycles} billing cycles`
      })
    }
  }

  return result
}

export function buildSupplierList(data: OCCData, utility: 'eversource' | 'ui'): Supplier[] {
  const isEversource = utility === 'eversource'
  const stdRate = (isEversource ? data.stdRateEversource : data.stdRateUI) ?? (isEversource ? 12.64 : 13.695)
  const nextRate = isEversource ? data.nextRateEversource : data.nextRateUI

  const list: Supplier[] = []

  list.push({
    name: isEversource ? 'Eversource standard service' : 'UI standard service',
    rate: stdRate,
    termCycles: 6,
    type: 'fixed',
    isStandard: true,
    isNext: false,
    termLabel: data.stdPeriod ?? 'Current period',
  })

  if (nextRate && Math.abs(nextRate - stdRate) > 0.01) {
    list.push({
      name: isEversource ? 'Eversource (next period)' : 'UI (next period)',
      rate: nextRate,
      termCycles: 6,
      type: 'fixed',
      isStandard: true,
      isNext: true,
      termLabel: data.nextPeriod ?? 'Upcoming period',
    })
  }

  data.suppliers.forEach(s => list.push(s))

  // Fallback demo data if OCC had no supplier offers
  if (list.filter(s => !s.isStandard).length === 0) {
    const fallbacks = [
      { name: 'Think Energy', rate: stdRate * 0.865, termCycles: 5 },
      { name: 'Town Square Energy', rate: stdRate * 0.865, termCycles: 6 },
      { name: 'Constellation NewEnergy', rate: stdRate * 0.89, termCycles: 7 },
      { name: 'Direct Energy', rate: stdRate * 0.91, termCycles: 6 },
    ]
    fallbacks.forEach(f => list.push({
      ...f, type: 'fixed', isStandard: false, isNext: false,
      termLabel: `${f.termCycles} billing cycles`
    }))
  }

  return list
}
