import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { AdminOrder, DetailWidgetProps } from "@medusajs/framework/types"
import { Button, Container, Heading, Text, toast } from "@medusajs/ui"
import { useState } from "react"
import { Link } from "react-router-dom"
import { loadSettings, printHtml } from "../lib/qz"
import { receiptHtml } from "../lib/receipt"

/** "Print receipt" on every order: straight to the receipt printer through QZ Tray, no browser dialog. */
const OrderReceiptWidget = ({ data: order }: DetailWidgetProps<AdminOrder>) => {
  const [busy, setBusy] = useState(false)
  const settings = loadSettings()

  const print = async () => {
    setBusy(true)
    try {
      await printHtml(receiptHtml(order, settings), settings)
      toast.success("Receipt sent to the printer")
    } catch (e) {
      toast.error((e as Error).message || "Could not print")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Receipt</Heading>
        <Button size="small" variant="secondary" isLoading={busy} onClick={print}>
          Print receipt
        </Button>
      </div>
      <div className="px-6 py-4">
        <Text size="small" className="text-ui-fg-subtle">
          {settings.printer || "Default printer"} · {settings.paperMm}mm ·{" "}
          <Link to="/settings/qz-tray" className="text-ui-fg-interactive">
            Change
          </Link>
        </Text>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({ zone: "order.details.side.before" })

export default OrderReceiptWidget
