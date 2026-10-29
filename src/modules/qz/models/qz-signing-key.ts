import { model } from "@medusajs/framework/utils"

/** The store's QZ Tray signing key, made on first use. */
const QzSigningKey = model.define("qz_signing_key", {
  id: model.id({ prefix: "qzkey" }).primaryKey(),
  private_key_pem: model.text(),
  certificate_pem: model.text(),
})

export default QzSigningKey
