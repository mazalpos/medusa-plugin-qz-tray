import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { QZ_MODULE } from "../../../../modules/qz"
import { windowsSetupScript } from "../../../../modules/qz/certificate"
import type QzModuleService from "../../../../modules/qz/service"

/** GET /admin/qz/setup-windows: the one-time no-prompt printing setup for a Windows till computer. */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const qz = req.scope.resolve<QzModuleService>(QZ_MODULE)
  res.setHeader("Content-Type", "application/octet-stream")
  res.setHeader("Content-Disposition", 'attachment; filename="qz-tray-printing-setup.bat"')
  res.send(windowsSetupScript((await qz.getKeys()).certificate_pem, qz.storeName()))
}
