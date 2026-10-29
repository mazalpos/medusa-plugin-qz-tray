import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { QZ_MODULE } from "../../../../modules/qz"
import type QzModuleService from "../../../../modules/qz/service"

/** GET /admin/qz/certificate: the public certificate QZ Tray shows and checks signatures against. */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const qz = req.scope.resolve<QzModuleService>(QZ_MODULE)
  res.setHeader("Content-Type", "text/plain; charset=utf-8")
  res.send((await qz.getKeys()).certificate_pem)
}
