import fs from 'node:fs'
import path from 'node:path'

const rootPath = path.resolve(process.cwd(), '..')
const sourcePath = path.resolve(rootPath, 'src/lib/eventsData.ts')
const outputPath = path.resolve(process.cwd(), 'src/data/eventCatalog.json')

const source = fs.readFileSync(sourcePath, 'utf8')
const start = source.indexOf('export const allEvents: Event[] = [')
const end = source.lastIndexOf('];')

if (start < 0 || end < 0 || end <= start) {
  throw new Error('Unable to parse src/lib/eventsData.ts')
}

const arrayText = source.slice(start, end)
const objectPattern = /\{\s*name:\s*"([^"]+)"[\s\S]*?category:\s*"([^"]+)"[\s\S]*?mainCategory:\s*"([^"]+)"[\s\S]*?rules:\s*\[([\s\S]*?)\]\s*\}/g
const rulePattern = /"((?:[^"\\]|\\.)*)"/g

const catalog = []
for (const match of arrayText.matchAll(objectPattern)) {
  const [, name, category, mainCategory, rulesRaw] = match
  const rules = Array.from(rulesRaw.matchAll(rulePattern), (ruleMatch) => ruleMatch[1].replace(/\\"/g, '"'))
  catalog.push({ name, category, mainCategory, rules })
}

if (!catalog.length) {
  throw new Error('No events parsed from src/lib/eventsData.ts')
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, JSON.stringify(catalog, null, 2))
console.log(`Wrote ${catalog.length} events to ${outputPath}`)
