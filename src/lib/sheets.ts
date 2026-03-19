import Papa from 'papaparse'
import { COLUMN_LABELS } from './columnLabels'

const SHEETS_CSV_URL = '/api/sheets'

export type DataRow = Record<string, string>

export async function fetchSheetData(): Promise<DataRow[]> {
  const res = await fetch(SHEETS_CSV_URL)
  if (!res.ok) throw new Error('無法載入資料')
  const text = await res.text()
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  })
  return parsed.data || []
}

export function getDisplayLabel(key: string): string {
  return COLUMN_LABELS[key] ?? key
}
