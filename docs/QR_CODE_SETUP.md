# QR Code Photo Upload Setup

The stringer workflow lets a stringer generate a QR code so they can snap the completion photo from their phone instead of the machine they're stringing at. Scanning the code opens the upload page on the phone. This only works if the phone can actually reach your local dev server, which requires one of the two options below.

## Option 1: Use your network IP (easiest for local network)

1. Find your computer's local IP address:
   ```bash
   # macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
   Look for something like `192.168.1.100` or `10.0.0.5`.

2. Add this to `apps/web/.env.local`:
   ```
   NEXT_PUBLIC_APP_URL=http://YOUR_IP_ADDRESS:3000
   ```
   Example:
   ```
   NEXT_PUBLIC_APP_URL=http://192.168.1.100:3000
   ```

3. Restart the Next.js dev server.

4. Make sure your phone is on the same Wi-Fi network as your computer.

## Option 2: Use ngrok (works across networks)

1. Install ngrok: https://ngrok.com/download

2. Start it:
   ```bash
   ngrok http 3000
   ```

3. Copy the HTTPS forwarding URL (e.g. `https://abc123.ngrok.app`).

4. Add to `apps/web/.env.local`:
   ```
   NEXT_PUBLIC_APP_URL=https://abc123.ngrok.app
   ```

5. Restart the Next.js dev server.

## Testing

1. Complete all stringing tasks on the stringer dashboard.
2. A QR code should appear.
3. If you see a warning about localhost, your `NEXT_PUBLIC_APP_URL` isn't set to a phone-reachable address — go back to Option 1 or 2.
4. Scan the QR code with your phone's camera.
5. Take a photo and upload.

## Troubleshooting

- **QR code doesn't work**: confirm `NEXT_PUBLIC_APP_URL` is set correctly and the dev server was restarted after the change.
- **"Connection refused" on phone**: confirm both devices are on the same Wi-Fi (Option 1) or that ngrok is still running (Option 2).
- **Changes not showing**: restart the Next.js dev server after changing `.env.local` — Next.js only reads env vars at boot.
- **Port 3000 already in use**: run on a different port and update `NEXT_PUBLIC_APP_URL` to match.
