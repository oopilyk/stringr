# QR Code Photo Upload Setup

The QR code photo upload feature requires your phone to access your development server. Here are your options:

## Option 1: Use Your Network IP (Easiest for local network)

1. Find your computer's local IP address:
   ```bash
   # On Mac/Linux:
   ifconfig | grep "inet " | grep -v 127.0.0.1

   # On Windows:
   ipconfig
   ```
   Look for something like `192.168.1.100` or `10.0.0.5`

2. Add this to `apps/web/.env.local`:
   ```
   NEXT_PUBLIC_APP_URL=http://YOUR_IP_ADDRESS:3000
   ```
   Example:
   ```
   NEXT_PUBLIC_APP_URL=http://192.168.1.100:3000
   ```

3. Restart your Next.js dev server

4. Make sure your phone is on the same WiFi network as your computer

## Option 2: Use ngrok (Works anywhere, even different networks)

1. Install ngrok: https://ngrok.com/download

2. Start ngrok:
   ```bash
   ngrok http 3000
   ```

3. Copy the HTTPS forwarding URL (e.g., `https://abc123.ngrok.app`)

4. Add to `apps/web/.env.local`:
   ```
   NEXT_PUBLIC_APP_URL=https://abc123.ngrok.app
   ```

5. Restart your Next.js dev server

## Testing

1. Complete all stringing tasks on the stringer dashboard
2. A QR code should appear
3. If you see a yellow warning about localhost, check your .env.local setup
4. Scan the QR code with your phone's camera
5. Take a photo and upload

## Troubleshooting

- **QR code doesn't work**: Make sure NEXT_PUBLIC_APP_URL is set correctly
- **"Connection refused" on phone**: Make sure both devices are on the same WiFi
- **Changes not showing**: Restart the Next.js dev server after changing .env.local
- **Port 3000 already in use**: Use a different port and update the URL accordingly
