import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { QZ_MODULE } from "../../../../modules/qz"
import { MAX_SIGN_LENGTH } from "../../../../modules/qz/certificate"
import type QzModuleService from "../../../../modules/qz/service"

/** POST /admin/qz/sign { request }: signs one QZ Tray request. Admin-only, like every /admin route. */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const request = (req.body as { request?: unknown } | undefined)?.request
  if (typeof request !== "string" || request.length === 0 || request.length > MAX_SIGN_LENGTH) {
    res.status(400).json({ code: "invalid_request", message: "request must be a QZ request string" })
    return
  }
  const qz = req.scope.resolve<QzModuleService>(QZ_MODULE)
  res.json({ signature: await qz.sign(request) })
}
