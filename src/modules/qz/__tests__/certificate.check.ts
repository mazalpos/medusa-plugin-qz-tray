// Run: npx tsx src/modules/qz/__tests__/certificate.check.ts
import assert from "node:assert/strict"
import { createVerify, X509Certificate } from "node:crypto"
import { makeCertificate, signForQz, windowsSetupScript } from "../certificate"

const k = makeCertificate("Test Store")
const cert = new X509Certificate(k.certificate_pem)
assert.match(cert.subject, /CN=Test Store/)
assert.ok(new Date(cert.validTo).getFullYear() > new Date().getFullYear() + 15, "valid for ~20 years")

// QZ checks a SHA512 signature of its request against the certificate's public key.
const sig = signForQz(k.private_key_pem, '{"call":"printers.find"}')
assert.ok(createVerify("SHA512").update('{"call":"printers.find"}').verify(cert.publicKey, sig, "base64"))
assert.ok(!createVerify("SHA512").update("tampered").verify(cert.publicKey, sig, "base64"))

const bat = windowsSetupScript(k.certificate_pem, 'Store "&|<> name')
assert.ok(bat.includes("override.crt"))
assert.ok(!/[|<>"]/.test(bat.split("\r\n")[1]), "store name cannot break out of the title line")
assert.ok(!bat.includes("PRIVATE KEY"), "setup file never carries the private key")

console.log("certificate checks passed")
