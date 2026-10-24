import { createRequire } from 'node:module'
import { mkdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const url = process.env.CAPTURE_URL
const output = process.env.CAPTURE_DIR
if (!url || !output) {
  console.error('[capture] CAPTURE_URL and CAPTURE_DIR are required')
  process.exit(1)
}
mkdirSync(output, { recursive: true })

const runtime = join(process.env.HOME, '.local/share/omgithub-playwright')
const require = createRequire(join(runtime, 'package.json'))
const { chromium } = require('playwright')

const configPath = join(runtime, 'linux.json')
const config = JSON.parse(readFileSync(configPath, 'utf8'))
try {
  process.env.DISPLAY ||= ':' + readFileSync(join(runtime, 'display'), 'utf8').trim()
} catch {
  process.env.DISPLAY ||= ':0'
}

const TIMING_PREFIX = '[timing]'
const time = async (label, fn) => {
  const started = performance.now()
  try {
    return await fn()
  } finally {
    console.log(`${TIMING_PREFIX} capture:${label.padEnd(22)} ${(performance.now() - started).toFixed(0)} ms`)
  }
}

const failure = (message, exitCode) => Object.assign(new Error(message), { exitCode })
const transient = error => failure(`temporary browser/navigation failure: ${error.message}`, 75)
const defect = error => failure(`rendering defect: ${error.message}`, 1)

let browser
let exitCode = 0

try {
  browser = await time('launch', () =>
    chromium
      .launch({ ...config.browser.launchOptions, timeout: 30000 })
      .catch(error => {
        throw transient(error)
      })
  )

  const views = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844 }
  ]

  for (const view of views) {
    const page = await time(`page:${view.name}`, () =>
      browser
        .newPage({
          viewport: { width: view.width, height: view.height },
          deviceScaleFactor: 1,
          isMobile: view.name === 'mobile',
          hasTouch: view.name === 'mobile'
        })
        .catch(error => {
          throw transient(error)
        })
    )
    page.setDefaultTimeout(30000)

    const pageErrors = []
    page.on('pageerror', error => pageErrors.push(error.message))
    page.on('console', message => {
      if (message.type() === 'error') console.error(`[browser:${view.name}] ${message.text()}`)
    })

    const response = await time(`navigate:${view.name}`, () =>
      page
        .goto(url, { waitUntil: 'load', timeout: 45000 })
        .catch(error => {
          throw transient(error)
        })
    )

    if (!response) throw transient(new Error('navigation returned no response'))
    if (!response.ok()) {
      const status = response.status()
      const retryable = status === 408 || status === 429 || status >= 500
      throw failure(`preview returned HTTP ${status}`, retryable ? 75 : 1)
    }

    const selector = process.env.CAPTURE_READY_SELECTOR || 'html[data-ready="true"]'
    await time(`ready:${view.name}`, async () => {
      try {
        await page.waitForSelector(selector, { state: 'attached', timeout: 20000 })
        await page.waitForFunction(
          () => document.documentElement.dataset.ready === 'true',
          undefined,
          { timeout: 4000 }
        ).catch(() => {})
      } catch (error) {
        throw defect(error)
      }
      await page.evaluate(() => document.fonts.ready)
      await page.waitForTimeout(900)
    })

    const info = await time(`content:${view.name}`, () =>
      page.evaluate(() => {
        const shell = document.querySelector('.shell')
        const text = document.body.innerText.trim()
        return {
          textLength: text.length,
          shellWidth: shell ? shell.getBoundingClientRect().width : 0,
          scrollWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth
        }
      })
    )

    if (info.textLength < 40 || info.shellWidth < 200) {
      throw defect(
        new Error(`page is blank or incomplete (text=${info.textLength}, shell=${info.shellWidth}px)`)
      )
    }
    if (info.scrollWidth > info.viewportWidth + 2) {
      console.warn(
        `[capture] ${view.name} has horizontal overflow (${info.scrollWidth}px > ${info.viewportWidth}px)`
      )
    }
    if (pageErrors.length) {
      console.warn(`[capture] ${view.name} page errors: ${pageErrors.join(' | ')}`)
    }

    const file = join(output, `final-${view.name}.png`)
    await time(`screenshot:${view.name}`, () =>
      page
        .screenshot({ path: file, fullPage: false, animations: 'disabled', timeout: 30000 })
        .catch(error => {
          if (error.name === 'TimeoutError' || !browser.isConnected()) throw transient(error)
          throw failure(`screenshot failed: ${error.message}`, 1)
        })
    )

    const bytes = statSync(file).size
    if (bytes < 5000) {
      throw defect(new Error(`screenshot ${view.name} is suspiciously small (${bytes} bytes)`))
    }
    console.log(`[capture] ${view.name} ${view.width}x${view.height} -> ${file} (${bytes} bytes)`)
    await page.close().catch(() => {})
  }
} catch (error) {
  exitCode = error.exitCode || 1
  console.error(`[capture] ${error.message}`)
} finally {
  if (browser) {
    await browser.close().catch(error => {
      console.error(`[capture] browser close failed: ${error.message}`)
      if (!exitCode) exitCode = 75
    })
  }
}

process.exit(exitCode)
