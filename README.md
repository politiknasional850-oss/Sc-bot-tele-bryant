## 🇮🇩 Panduan Deploy (Bahasa Indonesia)

### 🟢 Bagian 1: Deploy di Termux (Android)

Ini cara paling cepat buat ngetes bot langsung dari HP tanpa perlu hosting.

**1. Persiapan Termux**
Buka aplikasi Termux, lalu update *package list* dan install `Node.js` serta `git`:
```bash
pkg update && pkg upgrade -y
pkg install nodejs git -y
```

Cek apakah Node.js sudah terinstall (minimal v18):

```bash
node -v
```

2. Ambil Kode dari GitHub
Clone repo lo (ganti USERNAME dengan username GitHub lo):

```bash
git clone https://github.com/USERNAME/telegram-bot.git
cd telegram-bot
```

(Jika belum pakai GitHub, buat folder manual mkdir telegram-bot, masuk ke dalamnya, dan buat file satu per satu menggunakan nano).

3. Setup File .env
Buat file .env di dalam folder bot:

```bash
nano .env
```

Isi dengan token bot dan key lo:

```env
BOT_TOKEN=123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZ
IKY_KEYS=key1,key2,key3,key4,key5
```

Simpan dengan menekan CTRL + X, lalu Y, lalu Enter.

4. Install Dependencies
Jalankan perintah ini untuk mengunduh semua library (Telegraf, dotenv, cheerio):

```bash
npm install
```

5. Jalankan Bot

```bash
node bot.js
```

Jika muncul tulisan Bot jalan... tekan Ctrl+C buat stop., berarti bot sudah sukses berjalan.

⚠️ Trik Agar Bot Tidak Mati di Background:
OS Android sering membunuh aplikasi di background. Agar bot tetap jalan saat layar mati:

1. Tarik notifikasi Termux ke bawah, klik Acquire Wakelock.
2. Masuk ke Settings HP -> Apps -> Termux -> Battery -> pilih Unrestricted.
3. Jika ingin bot tetap jalan saat Termux ditutup, gunakan tmux atau nohup node bot.js &.

---

🟣 Bagian 2: Deploy di Pterodactyl Panel

Panduan ini berlaku universal untuk hosting mana pun yang menggunakan panel Pterodactyl.

1. Upload File ke Panel

1. Login ke panel.
2. Masuk ke tab Files.
3. Hapus file default (seperti index.js atau package.json bawaan) jika ada.
4. Upload semua file bot lo (bot.js, package.json, folder tools, dll).
   (Atau, jika menggunakan GitHub, buka menu Startup -> masukkan repo URL di bagian Git Repo Address agar panel otomatis pull kodenya).

2. Setup File .env

1. Masih di tab Files, klik New File.
2. Beri nama .env.
3. Klik file .env tersebut, lalu klik Edit (ikon pensil).
4. Masukkan token dan key lo:
   ```env
   BOT_TOKEN=123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZ
   IKY_KEYS=key1,key2,key3,key4,key5
   ```
5. Klik Save Content.

3. Install Dependencies
Ada dua cara untuk install library:

· Cara Otomatis: Saat menekan tombol Start, panel biasanya otomatis menjalankan npm install di background (jika package.json ada di root folder).
· Cara Manual: Buka tab Console, lalu ketik:
  ```bash
  npm install
  ```
  (Jika console terkunci, buka tab Startup dan tambahkan npm install && node bot.js di kolom Startup Command).

4. Atur Startup Command

1. Masuk ke tab Startup.
2. Di kolom Startup Command, pastikan isinya:
   ```bash
   node bot.js
   ```
   (Atau npm start jika sudah setting script start di package.json).
3. Simpan.

5. Nyalakan Bot

1. Balik ke tab Console.
2. Klik tombol Start.
3. Pantau log. Jika muncul Bot jalan... tekan Ctrl+C buat stop. tanpa error merah, bot sudah online.

⚠️ Catatan Penting:

· ENOSPC (Disk Penuh): Jika muncul error ENOSPC: no space left on device, storage penuh. Hapus cache dengan rm -rf ~/.npm atau minta admin membersihkan node.
· ERR_MODULE_NOT_FOUND: Jika muncul error ini, npm install gagal. Stop server, ketik npm install manual di Console, lalu Start lagi.
· Auto-Update GitHub: Jika menghubungkan repo di tab Startup, setiap kali push kode baru, cukup klik Restart di panel.

---

🇬🇧 Deployment Guide (English)

🟢 Part 1: Deploying on Termux (Android)

This is the fastest way to test the bot directly from your phone without needing a hosting service.

1. Termux Preparation
Open the Termux app, update the package list, and install Node.js & git:

```bash
pkg update && pkg upgrade -y
pkg install nodejs git -y
```

Verify Node.js is installed (minimum v18):

```bash
node -v
```

2. Get the Code from GitHub
Clone your repo (replace USERNAME with your GitHub username):

```bash
git clone https://github.com/USERNAME/telegram-bot.git
cd telegram-bot
```

(If you haven't used GitHub, create a folder manually mkdir telegram-bot, enter it, and create files one by one using nano).

3. Setup the .env File
Create a .env file inside the bot folder:

```bash
nano .env
```

Fill it with your bot token and API keys:

```env
BOT_TOKEN=123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZ
IKY_KEYS=key1,key2,key3,key4,key5
```

Save by pressing CTRL + X, then Y, then Enter.

4. Install Dependencies
Run this command to download all libraries (Telegraf, dotenv, cheerio):

```bash
npm install
```

5. Run the Bot

```bash
node bot.js
```

If you see Bot jalan... tekan Ctrl+C buat stop., the bot is successfully running.

⚠️ Trick to Keep the Bot Alive in Background:
Android OS often kills background apps. To keep the bot running when the screen is off:

1. Pull down the Termux notification, tap Acquire Wakelock.
2. Go to Phone Settings -> Apps -> Termux -> Battery -> select Unrestricted.
3. To keep it running even after closing Termux, use tmux or nohup node bot.js &.

---

🟣 Part 2: Deploying on Pterodactyl Panel

This guide works universally for any hosting provider using the Pterodactyl panel.

1. Upload Files to the Panel

1. Log in to your panel.
2. Go to the Files tab.
3. Delete default files (like the default index.js or package.json) if they exist.
4. Upload all your bot files (bot.js, package.json, tools folder, etc.).
   (Alternatively, if you use GitHub, go to the Startup tab -> enter your repo URL in the Git Repo Address field so the panel automatically pulls the code).

2. Setup the .env File

1. Still in the Files tab, click New File.
2. Name it .env.
3. Click the newly created .env file, then click Edit (pencil icon).
4. Enter your token and keys:
   ```env
   BOT_TOKEN=123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZ
   IKY_KEYS=key1,key2,key3,key4,key5
   ```
5. Click Save Content.

3. Install Dependencies
There are two ways to install libraries:

· Automatic: When you click Start, the panel usually runs npm install automatically in the background (if your package.json is in the root folder).
· Manual: Go to the Console tab, then type:
  ```bash
  npm install
  ```
  (If the console is locked, go to the Startup tab and add npm install && node bot.js in the Startup Command field).

4. Configure Startup Command

1. Go to the Startup tab.
2. In the Startup Command field, ensure it says:
   ```bash
   node bot.js
   ```
   (Or npm start if you've set the start script in package.json).
3. Save.

5. Start the Bot

1. Go back to the Console tab.
2. Click the Start button.
3. Monitor the console log. If you see Bot jalan... tekan Ctrl+C buat stop. without red errors, your bot is online.

⚠️ Important Notes:

· ENOSPC (Disk Full): If you get ENOSPC: no space left on device, your storage is full. Clear the cache using rm -rf ~/.npm or ask the admin to clean up the node.
· ERR_MODULE_NOT_FOUND: If you see this error, npm install failed. Stop the server, run npm install manually in the Console, then Start again.
· GitHub Auto-Update: If you linked a GitHub repo in the Startup tab, every time you push new code, you just need to click Restart in the panel to pull the latest updates.

```

I just give the tools, whether they're used right or not is your business, boss.
