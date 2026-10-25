import * as cheerio from 'cheerio';

export const pendingSitekey = new Set();

export const meta = {
  id: 'sitekey',
  label: '🔑 Sitekey Scraper',
  description: 'Ekstrak Cloudflare Turnstile Sitekey',
};

export async function open(ctx) {
  await ctx.answerCbQuery();
  pendingSitekey.add(ctx.chat.id);
  const text = '🔑 *Sitekey Scraper*\n\nKirim URL website yang mau di-scrape Sitekey-nya.';
  const keyboard = { inline_keyboard: [[{ text: '⬅️ Kembali', callback_data: 'back' }]] };
  try { await ctx.editMessageCaption(text, { parse_mode: 'Markdown', reply_markup: keyboard }); } 
  catch { await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: keyboard }); }
}

async function extractSitekey(targetUrl) {
  try {
    const res = await fetch(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);
    const sitekeys = new Set();

    $('script').each((_, el) => { const matches = ($(el).html() || '').match(/0x[A-Za-z0-9_-]{20,}/g); if (matches) matches.forEach(k => sitekeys.add(k)); });
    $('div.cf-turnstile, [data-sitekey]').each((_, el) => { const key = $(el).attr('data-sitekey'); if (key && key.startsWith('0x')) sitekeys.add(key); });
    if (sitekeys.size > 0) return { method: 'HTML/DOM', keys: [...sitekeys] };

    const jsFiles = [...$('script').map((_, el) => $(el).attr('src')).get()].filter(src => src && src.includes('.js'));
    const linkJs = [...$('link[rel="preload"][as="script"], link[rel="modulepreload"]').map((_, el) => $(el).attr('href')).get()].filter(href => href && href.includes('.js'));
    const allJsFiles = [...new Set([...jsFiles, ...linkJs])].slice(0, 15);

    for (const jsPath of allJsFiles) {
      try {
        const fullJsUrl = jsPath.startsWith('http') ? jsPath : new URL(jsPath, targetUrl).href;
        const jsRes = await fetch(fullJsUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, signal: AbortSignal.timeout(5000) });
        if (!jsRes.ok) continue;
        const matches = (await jsRes.text()).match(/0x[A-Za-z0-9_-]{20,}/g);
        if (matches) matches.forEach(k => sitekeys.add(k));
      } catch { continue; }
    }
    if (sitekeys.size > 0) return { method: 'External JS Scan', keys: [...sitekeys] };
    return { method: 'None', keys: [] };
  } catch (error) {
    throw new Error('Gagal akses website: ' + error.message);
  }
}

export async function handleText(ctx) {
  const chatId = ctx.chat.id;
  if (!pendingSitekey.has(chatId)) return false;
  const text = (ctx.message.text || '').trim();
  if (!text) return false;
  if (!text.startsWith('http')) { await ctx.reply('❌ URL harus dimulai dengan `http://` atau `https://`', { parse_mode: 'Markdown' }); return true; }

  pendingSitekey.delete(chatId);
  const loading = await ctx.reply('⏳ Lagi nge-scan sitekey, sabar...');
  const keyboard = { inline_keyboard: [[{ text: '🔄 Scan Lagi', callback_data: 'sitekey' }], [{ text: '⬅️ Kembali', callback_data: 'back' }]] };

  try {
    const result = await extractSitekey(text);
    let caption = `🔑 *Sitekey Scraper*\n🎯 Target: ${text}\n\n`;
    if (result.keys.length > 0) {
      caption += `✅ *Ditemukan (${result.keys.length})*\nMetode: \`${result.method}\`\n\n`;
      result.keys.forEach((k, i) => { caption += `*${i + 1}.* \`${k}\`\n`; });
    } else {
      caption += '❌ *Sitekey tidak ditemukan.*\nWebsite mungkin nggak pakai Turnstile, atau lagi nge-hidden key-nya.';
    }
    await ctx.telegram.editMessageText(chatId, loading.message_id, undefined, caption, { parse_mode: 'Markdown', reply_markup: keyboard, disable_web_page_preview: true });
  } catch (err) {
    await ctx.telegram.editMessageText(chatId, loading.message_id, undefined, '❌ Error: `' + err.message + '`', { parse_mode: 'Markdown', reply_markup: keyboard });
  }
  return true;
  }
