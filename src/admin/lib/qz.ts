import qzTray from "qz-tray"

/** The bits of QZ Tray's client we touch (the package ships no types). */
type QzApi = {
  websocket: { isActive(): boolean; connect(opts?: { retries?: number; delay?: number }): Promise<void> }
  security: {
    setCertificatePromise(cb: (resolve: (v?: unknown) => void) => void): void
    setSignaturePromise(cb: (toSign: string) => (resolve: (v?: unknown) => void) => void): void
    setSignatureAlgorithm(algorithm: string): void
  }
  printers: { find(query?: string): Promise<string | string[]>; getDefault(): Promise<string> }
  configs: { create(printer: string, opts: Record<string, unknown>): unknown }
  print(config: unknown, data: unknown[]): Promise<void>
}
const qz = qzTray as unknown as QzApi

/** Per-computer settings: the printer and paper belong to the till, not the store. */
export type ReceiptSettings = { printer: string; paperMm: 58 | 80; header: string; footer: string }
const KEY = "qz-tray-receipt-settings"
const DEFAULTS: ReceiptSettings = { printer: "", paperMm: 80, header: "", footer: "Thank you!" }

export function loadSettings(): ReceiptSettings {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") }
  } catch {
    return DEFAULTS
  }
}
export function saveSettings(s: ReceiptSettings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    // private window: settings last for this visit only
  }
}

async function admin(path: string, init: RequestInit = {}): Promise<string> {
  const res = await fetch(`/admin/qz/${path}`, { credentials: "include", ...init })
  if (!res.ok) throw new Error(`QZ ${path}: ${res.status}`)
  return res.text()
}

// QZ on a store till can take ~6s to answer, so a short limit gives up too early.
const CONNECT_TIMEOUT_MS = 15000
let connecting: Promise<void> | null = null

/** Connects once per page, with every request signed by this store's key (no "Allow?" prompts once trusted). */
export async function connect(): Promise<void> {
  if (qz.websocket.isActive()) return
  connecting ??= (async () => {
    qz.security.setSignatureAlgorithm("SHA512")
    qz.security.setCertificatePromise((resolve) => void admin("certificate").then(resolve, () => resolve()))
    qz.security.setSignaturePromise((toSign) => (resolve) =>
      void admin("sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request: toSign }),
      }).then((t) => resolve(JSON.parse(t).signature), () => resolve())
    )
    let timer: ReturnType<typeof setTimeout> | undefined
    await Promise.race([
      qz.websocket.connect({ retries: 0, delay: 0 }),
      new Promise((_, reject) => (timer = setTimeout(() => reject(new Error("QZ Tray is not running on this computer")), CONNECT_TIMEOUT_MS))),
    ]).finally(() => clearTimeout(timer))
  })().finally(() => (connecting = null))
  return connecting
}

export async function listPrinters(): Promise<string[]> {
  await connect()
  const found = await qz.printers.find()
  return Array.isArray(found) ? found : [found]
}

/** Prints one receipt as HTML, sized to the roll. Throws with a readable message on failure. */
export async function printHtml(html: string, settings = loadSettings()): Promise<void> {
  await connect()
  const printer = settings.printer || (await qz.printers.getDefault())
  // Printable width: 72mm on an 80mm roll, 48mm on a 58mm roll.
  const width = settings.paperMm === 58 ? 48 : 72
  const config = qz.configs.create(printer, { units: "mm", size: { width }, margins: 0, scaleContent: true, rasterize: true })
  await qz.print(config, [{ type: "pixel", format: "html", flavor: "plain", data: html }])
}

export async function downloadWindowsSetup(): Promise<void> {
  const res = await fetch("/admin/qz/setup-windows", { credentials: "include" })
  if (!res.ok) throw new Error(`Setup file: ${res.status}`)
  const url = URL.createObjectURL(await res.blob())
  const a = Object.assign(document.createElement("a"), { href: url, download: "qz-tray-printing-setup.bat" })
  a.click()
  URL.revokeObjectURL(url)
}
