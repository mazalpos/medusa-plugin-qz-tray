import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Input, Label, Select, StatusBadge, Text, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { downloadWindowsSetup, listPrinters, loadSettings, printHtml, ReceiptSettings, saveSettings } from "../../../lib/qz"
import { receiptHtml } from "../../../lib/receipt"

const SAMPLE = {
  display_id: 1001,
  created_at: new Date(),
  currency_code: "usd",
  items: [
    { title: "Test print", variant_title: null, quantity: 1, total: 10 },
    { title: "Second line", variant_title: "Large", quantity: 2, total: 5 },
  ],
  subtotal: 15,
  tax_total: 1.24,
  total: 16.24,
}

/** Settings > Receipt printer: connect to QZ Tray, pick this computer's printer, test it. */
const QzTraySettingsPage = () => {
  const [s, setS] = useState<ReceiptSettings>(loadSettings)
  const [printers, setPrinters] = useState<string[]>([])
  const [status, setStatus] = useState<"checking" | "connected" | "offline">("checking")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    listPrinters().then(
      (p) => (setPrinters(p), setStatus("connected")),
      () => setStatus("offline")
    )
  }, [])

  const update = (patch: Partial<ReceiptSettings>) => {
    const next = { ...s, ...patch }
    setS(next)
    saveSettings(next)
  }

  const run = async (job: () => Promise<void>, done: string) => {
    setBusy(true)
    try {
      await job()
      toast.success(done)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Receipt printer</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Prints receipts straight to a thermal printer through QZ Tray. Saved on this computer.
          </Text>
        </div>
        <StatusBadge color={status === "connected" ? "green" : status === "offline" ? "red" : "grey"}>
          {status === "connected" ? "QZ Tray connected" : status === "offline" ? "QZ Tray not found" : "Checking"}
        </StatusBadge>
      </div>

      <div className="grid grid-cols-1 gap-4 px-6 py-4 md:grid-cols-2">
        <div className="flex flex-col gap-y-2">
          <Label>Printer</Label>
          <Select value={s.printer || "__default"} onValueChange={(v) => update({ printer: v === "__default" ? "" : v })}>
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="__default">Computer's default printer</Select.Item>
              {printers.map((p) => (
                <Select.Item key={p} value={p}>
                  {p}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
        <div className="flex flex-col gap-y-2">
          <Label>Paper roll</Label>
          <Select value={String(s.paperMm)} onValueChange={(v) => update({ paperMm: v === "58" ? 58 : 80 })}>
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="80">80mm</Select.Item>
              <Select.Item value="58">58mm</Select.Item>
            </Select.Content>
          </Select>
        </div>
        <div className="flex flex-col gap-y-2">
          <Label>Receipt header</Label>
          <Input value={s.header} placeholder="Store name" onChange={(e) => update({ header: e.target.value })} />
        </div>
        <div className="flex flex-col gap-y-2">
          <Label>Receipt footer</Label>
          <Input value={s.footer} onChange={(e) => update({ footer: e.target.value })} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-4">
        <Text size="small" className="text-ui-fg-subtle">
          {status === "offline" ? (
            <>
              Install QZ Tray from <a className="text-ui-fg-interactive" href="https://qz.io/download/" target="_blank" rel="noreferrer">qz.io</a>, or on Windows run the setup file.
            </>
          ) : (
            "Windows tills: run the setup file once and QZ Tray stops asking to allow each print."
          )}
        </Text>
        <div className="flex gap-2">
          <Button size="small" variant="secondary" disabled={busy} onClick={() => run(downloadWindowsSetup, "Setup file downloaded")}>
            Windows setup file
          </Button>
          <Button size="small" isLoading={busy} disabled={status !== "connected"} onClick={() => run(() => printHtml(receiptHtml(SAMPLE, s), s), "Test receipt printed")}>
            Print test receipt
          </Button>
        </div>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({ label: "Receipt printer" })

export default QzTraySettingsPage
