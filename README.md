# QZ Tray receipt printing for Medusa

Print receipts from Medusa Admin straight to a thermal receipt printer. One click on an order, the receipt comes out. No browser print dialog, no "Allow this website?" pop-ups.

Built and used in production by [MazalPOS](https://mazalpos.com), the point of sale for salons, spas and retail stores that runs on Medusa v2.

## What you get

- **Print receipt** button on every order page in Medusa Admin.
- **Settings → Receipt printer**: shows whether QZ Tray is running, lists the printers on this computer, paper size (80mm or 58mm), receipt header and footer, and a test print.
- **Signed printing**: every QZ Tray request is signed on your Medusa server with your store's own key. The private key never leaves the server; the admin only receives signatures.
- **Windows setup file**: one download installs QZ Tray if needed and makes it trust your store, so receipts print with no prompts at all.

Works with any printer QZ Tray can see. Used daily on a Star TSP100 with 80mm paper.

## How it works

1. [QZ Tray](https://qz.io) is a small free app that runs on the till computer and lets a web page talk to local printers.
2. When you click Print, the admin asks QZ Tray to print. QZ Tray asks the page to prove who it is.
3. The admin sends QZ's request to `POST /admin/qz/sign`. Your Medusa server signs it with the store's key and returns only the signature.
4. QZ Tray checks the signature against your store's certificate (`GET /admin/qz/certificate`) and prints.

The first time it runs, the plugin creates a 2048-bit RSA key and a self-signed certificate for your store and keeps them in your database. Once a computer trusts that certificate (tick "Remember" in QZ's prompt, or run the Windows setup file), it prints silently from then on. You can use a certificate bought from QZ instead (see Options).

## Install

```bash
npm install medusa-plugin-qz-tray
```

Add it to `medusa-config.ts`:

```ts
module.exports = defineConfig({
  // ...
  plugins: [
    {
      resolve: "medusa-plugin-qz-tray",
      options: {
        storeName: "My Store",
      },
    },
  ],
})
```

Run the migration:

```bash
npx medusa db:migrate
```

Then install [QZ Tray](https://qz.io/download/) on each computer that prints (or download the Windows setup file from Settings → Receipt printer), pick the printer, and print a test receipt.

## Options

| Option | Default | What it does |
|---|---|---|
| `storeName` | `Medusa store` | Name on the generated certificate and the Windows setup file. |
| `certificate` | none | Your own PEM certificate, e.g. one issued by QZ. Use with `privateKey`. |
| `privateKey` | none | The PEM private key for `certificate`. Keep it in an environment variable. |

## API routes

All routes sit under `/admin` and need an authenticated admin user.

| Route | Returns |
|---|---|
| `GET /admin/qz/certificate` | The store's public certificate (PEM). |
| `POST /admin/qz/sign` | `{ "signature": "..." }` for `{ "request": "<QZ request>" }`. |
| `GET /admin/qz/setup-windows` | The one-time Windows setup file (`.bat`). Holds only the public certificate. |

## Requirements

- Medusa v2.19 or later
- QZ Tray 2.2 or later on the printing computer

## About

Made by [MazalPOS](https://mazalpos.com). We run Medusa v2 behind our iPad till, staff apps and back office for live stores in Las Vegas, and this is the printing code from our back office, opened up for the Medusa community. Issues and pull requests are welcome.

MIT licensed. QZ Tray is a trademark of QZ Industries, LLC; this plugin is not affiliated with QZ Industries.
