#!/usr/bin/env bun
import { Command } from 'commander'

import { getSaleCommand } from './commands'
import { LOCALES, CURRENCIES, DEFAULT_LOCALE, DEFAULT_CURRENCY } from '../lib/constants'

const program = new Command()

program
  .name('weverse-shop')
  .description('CLI tool for fetching Weverse Shop product data')
  .version('0.1.0')

program
  .command('sale')
  .description('Fetch sale/product information by ID')
  .requiredOption('-s, --sale-id <number>', 'Sale ID to fetch', (value) => {
    const parsed = parseInt(value, 10)
    if (isNaN(parsed)) {
      throw new Error(`Invalid sale ID: ${value}`)
    }
    return parsed
  })
  .option('-a, --artist-id <number>', 'Artist ID (optional, will be auto-detected)', (value) => {
    const parsed = parseInt(value, 10)
    if (isNaN(parsed)) {
      throw new Error(`Invalid artist ID: ${value}`)
    }
    return parsed
  })
  .option(
    '-l, --locale <string>',
    `Locale (${LOCALES.join(', ')})`,
    DEFAULT_LOCALE
  )
  .option(
    '-c, --currency <string>',
    `Currency (${CURRENCIES.join(', ')})`,
    DEFAULT_CURRENCY
  )
  .option('--json', 'Output raw JSON instead of formatted text')
  .option('--refresh-cache', 'Force refresh buildId cache before fetching')
  .action(getSaleCommand)

program.parse()
