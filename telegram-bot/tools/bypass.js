const API_BASE = 'https://api.theresav.eu/api/bypass/universal';
const API_KEY = '6Z7uJ';

export const pendingBypass = new Set();

export const meta = {
  id: 'bypass',
  label: '🛡️ Universal Bypass',
  description: 'Bypass link shortener / safety link',
};

export async function open(ctx) {
  await ctx.answerCbQuery();
  pendingBypass.add(ctx.chat.id);
  const text = '🛡️ *Universal Bypass*\n\nKirim link yang mau di-bypass.\nContoh: `https://sfl.gl/Rf5N`';
  const keyboard = { inline_keyboard: [[{ text: '⬅️ Kembali', callback_data: 'back' }]] };
  try { await ctx.editMessageCaption(text, { parse_mode: 'Markdown', reply_markup: keyboard }); } 
  catch { await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: keyboard }); }
}

export async function handleText(ctx) {
  const chatId = ctx.chat.id;
  if (!pendingBypass.has(chatId)) return false;

  const text = (ctx.message.text || '').trim();
  if (!text) return false;
  if (!/^https?:\/\//i.test(text)) {
    await ctx.reply('❌ Link harus mulai dari `http://` atau `https://`', { parse_mode: 'Markdown' });
    return true;
  }

  pendingBypass.delete(chatId);
  const loading = await ctx.reply('⏳ Lagi bypass link, sabar...');
  const keyboard = { inline_keyboard: [[{ text: '🔄 Bypass Lagi', callback_data: 'bypass' }], [{ text: '⬅️ Kembali', callback_data: 'back' }]] };

  try {
    const url = `${API_BASE}?url=${encodeURIComponent(text)}`;
    const res = await fetch(url, { method: 'GET', headers: { 'x-apikey': API_KEY } });
    const data = await res.json();

    let caption;
    if (!data?.status && !data?.result) {
      caption = '❌ Gagal bypass.\n`' + JSON.stringify(data).slice(0, 500) + '`';
    } else {
      const bypassed = data.result || data.bypassed || data.url || JSON.stringify(data, null, 2);
      caption = `✅ *Bypass Sukses!*\n\n🔗 *Link Asli:*\n${text}\n\n🎯 *Link Bypassed:*\n${bypassed}`;
    }
    await ctx.telegram.editMessageText(chatId, loading.message_id, undefined, caption, { parse_mode: 'Markdown', reply_markup: keyboard, disable_web_page_preview: true });
  } catch (err) {
    await ctx.telegram.editMessageText(chatId, loading.message_id, undefined, '❌ Error: `' + (err.message ?? 'unknown') + '`', { parse_mode: 'Markdown' });
  }
  return true;
}
