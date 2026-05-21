import type { Parser } from './types'
import { parseBancolombia, isBancolombiaSender } from './bancolombia'
import { parseBinance, isBinanceSender } from './binance'
import { parseMercantil, isMercantilSender } from './mercantil'

export type { ParsedTransaction, ParseInput, Parser, ParserSource } from './types'
export { isBancolombiaSender, isBinanceSender, isMercantilSender }

export function getParserForSender(fromHeader: string): Parser | null {
  if (isBancolombiaSender(fromHeader)) return parseBancolombia
  if (isBinanceSender(fromHeader)) return parseBinance
  if (isMercantilSender(fromHeader)) return parseMercantil
  return null
}
