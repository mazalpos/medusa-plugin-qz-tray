import { createSign, generateKeyPairSync, randomBytes } from "node:crypto"
import forge from "node-forge"

/**
 * QZ Tray asks "Allow this website?" on every print while requests are unsigned. Signing every
 * request with the store's own certificate lets the merchant trust it once (Remember, or the
 * Windows setup file below); after that receipts print with no prompt. A self-signed certificate
 * is enough for that. QZ's paid certificate only skips the one-time trust step.
 */
export type QzKeys = { private_key_pem: string; certificate_pem: string }

export function makeCertificate(commonName: string): QzKeys {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  })
  const cert = forge.pki.createCertificate()
  cert.publicKey = forge.pki.publicKeyFromPem(publicKey)
  cert.serialNumber = "01" + randomBytes(8).toString("hex")
  cert.validity.notBefore = new Date()
  cert.validity.notAfter = new Date(Date.now() + 20 * 365 * 24 * 3600 * 1000)
  const attrs = [
    { name: "commonName", value: commonName },
    { name: "organizationName", value: commonName },
  ]
  cert.setSubject(attrs)
  cert.setIssuer(attrs)
  cert.sign(forge.pki.privateKeyFromPem(privateKey), forge.md.sha256.create())
  return { private_key_pem: privateKey, certificate_pem: forge.pki.certificateToPem(cert) }
}

/** QZ hands over a short JSON request; anything long is not one of its requests. */
export const MAX_SIGN_LENGTH = 100_000

export function signForQz(privateKeyPem: string, toSign: string): string {
  return createSign("SHA512").update(toSign).sign(privateKeyPem, "base64")
}

/** The QZ Tray release the setup file installs when a computer has none. */
export const QZ_WINDOWS_INSTALLER =
  "https://github.com/qzind/tray/releases/download/v2.3.0/qz-tray-2.3.0-x86_64.exe"

/**
 * A one-time Windows setup file for a till computer. Saved as QZ's override.crt
 * (qz.io/docs/signing), the store's certificate becomes a trusted root on that computer, so QZ
 * stops prompting for every call (connect, find printer, print). Installs QZ Tray when missing,
 * asks for admin rights once, then restarts QZ: it reads override.crt only on start, and runs as
 * java/javaw with qz-tray.jar, so it is stopped the way QZ's own installer does.
 * Base64 lines hold only A-Z a-z 0-9 + / =, so they are safe in cmd's echo.
 */
export function windowsSetupScript(certificatePem: string, storeName: string): string {
  const certLines = certificatePem
    .trim()
    .split(/\r?\n/)
    .map((l) => `  echo ${l}`)
    .join("\r\n")
  const name = storeName.replace(/[^A-Za-z0-9 .&'-]/g, "")
  return [
    "@echo off",
    `title QZ Tray printing setup - ${name}`,
    "net session >nul 2>&1",
    "if errorlevel 1 (",
    "  powershell -NoProfile -Command \"Start-Process -FilePath '%~f0' -Verb RunAs\"",
    "  exit /b",
    ")",
    'set "QZ=%ProgramFiles%\\QZ Tray"',
    'if not exist "%QZ%\\qz-tray.exe" (',
    "  echo Installing QZ Tray...",
    `  powershell -NoProfile -Command "$ProgressPreference='SilentlyContinue'; Invoke-WebRequest '${QZ_WINDOWS_INSTALLER}' -OutFile (Join-Path $env:TEMP 'qz-tray-setup.exe')"`,
    '  start /wait "" "%TEMP%\\qz-tray-setup.exe" /S',
    ")",
    'if not exist "%QZ%\\qz-tray.exe" (',
    "  echo QZ Tray did not install. Check the internet connection and run this file again.",
    "  pause",
    "  exit /b 1",
    ")",
    "(",
    certLines,
    ') > "%QZ%\\override.crt"',
    `powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'qz-tray.exe' -or ($_.Name -match '^javaw?[.]exe$' -and $_.CommandLine -match 'qz-tray|qz[.]App') } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"`,
    "timeout /t 3 /nobreak >nul",
    'explorer.exe "%QZ%\\qz-tray.exe"',
    "echo.",
    "echo Done. QZ Tray restarted with this store's certificate. Receipts now print with no pop-ups.",
    "pause",
    "",
  ].join("\r\n")
}
