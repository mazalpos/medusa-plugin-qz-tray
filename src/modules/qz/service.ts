import { MedusaService } from "@medusajs/framework/utils"
import QzSigningKey from "./models/qz-signing-key"
import { makeCertificate, QzKeys, signForQz } from "./certificate"

export type QzPluginOptions = {
  /** Bring your own certificate (e.g. one bought from QZ). Both must be set, or a key is made for you. */
  certificate?: string
  privateKey?: string
  /** Name on the generated certificate and the Windows setup file. */
  storeName?: string
}

class QzModuleService extends MedusaService({ QzSigningKey }) {
  protected readonly options_: QzPluginOptions

  constructor(container: Record<string, unknown>, options: QzPluginOptions = {}) {
    super(...arguments)
    this.options_ = options
  }

  storeName(): string {
    return this.options_.storeName?.trim() || "Medusa store"
  }

  /** The configured certificate, else the stored one, else a new one. Two first prints racing both insert; the oldest row wins for both. */
  async getKeys(): Promise<QzKeys> {
    const { certificate, privateKey } = this.options_
    if (certificate && privateKey) return { certificate_pem: certificate, private_key_pem: privateKey }
    const oldest = () => this.listQzSigningKeys({}, { take: 1, order: { created_at: "ASC" } })
    const [found] = await oldest()
    if (found) return found
    await this.createQzSigningKeys(makeCertificate(this.storeName()))
    return (await oldest())[0]
  }

  async sign(request: string): Promise<string> {
    return signForQz((await this.getKeys()).private_key_pem, request)
  }
}

export default QzModuleService
