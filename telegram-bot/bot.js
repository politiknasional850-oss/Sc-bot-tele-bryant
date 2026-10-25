import 'dotenv/config';
import { Telegraf } from 'telegraf';
import { existsSync, createReadStream } from 'fs';

// ==========================================
// IMPORT SEMUA TOOL
// ==========================================
import { meta as fotolinkMeta, open as openFotolink, handlePhoto } from './tools/fotolink.js';
import { meta as ampresetMeta, open as openAmpreset, handleText as handleAmpresetText } from './tools/ampreset.js';
import { meta as virtualnumberMeta, open as openVirtualnumber } from './tools/virtualnumber.js';
import { meta as otpcheckerMeta, open as openOtpchecker, handleText as handleOtpText } from './tools/otpchecker.js';
import { meta as randomanimeMeta, open as openRandomanime } from './tools/randomanime.js';
import { meta as bypassMeta, open as openBypass, handleText as handleBypassText } from './tools/bypass.js';
import { meta as sitekeyMeta, open as openSitekey, handleText as handleSitekeyText } from './tools/sitekey.js';
import { meta as removeclothesMeta, open as openRemoveclothes, handleText as handleRemoveclothesText } from './tools/removeclothes.js';
import { meta as generatekeyMeta, open as openGeneratekey } from './tools/generatekey.js';

// ==========================================
// KONFIGURASI BOT
// ==========================================
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('BOT_TOKEN belum diset di .env, bos.');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const THUMBNAIL_PATH = 'thumbnail.jpg';

const CAPTION_TEXT =
  '👋 *Selamat datang, Boss!*\n\n' +
  'Silakan *pilih fitur yang diinginkan* di bawah ini 👇';

// ==========================================
// DAFTAR SEMUA TOOL (9 Fitur)
// ==========================================
const TOOLS = [
  fotolinkMeta,
  ampresetMeta,
  virtualnumberMeta,
  otpcheckerMeta,
  randomanimeMeta,
  bypassMeta,
  sitekeyMeta,
  removeclothesMeta,
  generatekeyMeta,
];

// ==========================================
// HELPER MENU KEYBOARD
// ==========================================
function buildMenuKeyboard() {
  const rows = [];
  let row = [];
  for (const t of TOOLS) {
    row.push({ text: t.label, callback_data: t.id });
    if (row.length === 2) {
      rows.push(row);
      row = [];
    }
  }
  if (row.length) rows.push(row);
  return { inline_keyboard: rows };
}

async function sendMenu(ctx) {
  const chatId = ctx.chat.id;
  const extra = {
    reply_markup: buildMenuKeyboard(),
    parse_mode: 'Markdown',
  };

  if (existsSync(THUMBNAIL_PATH)) {
    await ctx.telegram.sendPhoto(
      chatId,
      { source: createReadStream(THUMBNAIL_PATH) },
      { caption: CAPTION_TEXT, ...extra }
    );
  } else {
    console.warn('Thumbnail nggak ada, kirim text aja.');
    await ctx.telegram.sendMessage(chatId, CAPTION_TEXT, extra);
  }
}

// ==========================================
// HANDLER COMMANDS
// ==========================================
bot.start(sendMenu);
bot.command('menu', sendMenu);

// ==========================================
// HANDLER TOMBOL "KEMBALI" (Hapus & Kirim Ulang)
// ==========================================
bot.action('back', async (ctx) => {
  await ctx.answerCbQuery();
  
  try {
    await ctx.deleteMessage();
  } catch (e) {
    console.error('Gagal hapus pesan:', e.message);
  }

  await sendMenu(ctx);
});

// ==========================================
// HANDLER TOMBOL FITUR UTAMA
// ==========================================
const openers = {
  fotolink: openFotolink,
  ampreset: openAmpreset,
  virtualnumber: openVirtualnumber,
  otpchecker: openOtpchecker,
  randomanime: openRandomanime,
  bypass: openBypass,
  sitekey: openSitekey,
  removeclothes: openRemoveclothes,
  generatekey: openGeneratekey,
};

const toolIds = TOOLS.map((t) => t.id);
bot.action(toolIds, async (ctx) => {
  const id = ctx.match[0];
  const fn = openers[id];
  if (fn) await fn(ctx);
  else await ctx.answerCbQuery('Tool belum tersedia');
});

// ==========================================
// HANDLER INPUT FOTO (Untuk Foto to Link)
// ==========================================
bot.on('photo', async (ctx) => {
  await handlePhoto(ctx);
});

// ==========================================
// HANDLER INPUT TEKS (Router)
// ==========================================
bot.on('text', async (ctx) => {
  // Skip command
  if (ctx.message.text.startsWith('/')) return;

  let handled = await handleAmpresetText(ctx);
  if (handled) return;

  handled = await handleOtpText(ctx);
  if (handled) return;

  handled = await handleBypassText(ctx);
  if (handled) return;

  handled = await handleSitekeyText(ctx);
  if (handled) return;

  handled = await handleRemoveclothesText(ctx);
  if (handled) return;
});

// ==========================================
// ERROR HANDLER & LAUNCH
// ==========================================
bot.catch((err, ctx) => {
  console.error(`Error di update ${ctx.updateType}:`, err);
});

bot.launch();
console.log('Bot jalan... tekan Ctrl+C buat stop.');

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
