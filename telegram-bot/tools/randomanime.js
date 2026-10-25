const API_URL = 'https://api.ikyyxd.my.id/random/animehot';

export const meta = {
  id: 'randomanime',
  label: '🌸 Random Anime',
  description: 'Random anime female (gambar/video)',
};

export async function open(ctx) {
  await ctx.answerCbQuery();
  const keyboard = { inline_keyboard: [[{ text: '🔄 Roll Lagi', callback_data: 'randomanime' }], [{ text: '⬅️ Kembali', callback_data: 'back' }]] };
  const messageId = ctx.callbackQuery?.message?.message_id;

  if (messageId) {
    try { await ctx.editMessageCaption('🌸 *Random Anime*\n\nLagi ambil, sabar...', { parse_mode: 'Markdown', reply_markup: keyboard }); } 
    catch { await ctx.editMessageText('🌸 *Random Anime*\n\nLagi ambil, sabar...', { parse_mode: 'Markdown', reply_markup: keyboard }); }
  }

  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const contentType = res.headers.get('content-type') || '';
    let isVideo = contentType.includes('video');
    let buffer, finalUrl = null;

    if (contentType.includes('application/json')) {
      const data = await res.json();
      finalUrl = data.url || data.result?.url || data.data?.url;
      if (!finalUrl) throw new Error('URL tidak ditemukan di JSON.');
      isVideo = finalUrl.match(/\.(mp4|webm|mov)/i) || finalUrl.includes('video');
    } else {
      const arrayBuf = await res.arrayBuffer();
      buffer = Buffer.from(arrayBuf);
      if (buffer.length === 0) throw new Error('Data kosong.');
    }

    if (messageId) {
      const mediaPayload = finalUrl ? finalUrl : { source: buffer };
      await ctx.telegram.editMessageMedia(
        ctx.chat.id, messageId, undefined,
        { type: isVideo ? 'video' : 'photo', media: mediaPayload, caption: '🌸 *Random Anime*', parse_mode: 'Markdown' },
        { reply_markup: keyboard }
      );
    }
  } catch (err) {
    if (messageId) {
      try { await ctx.telegram.editMessageText(ctx.chat.id, messageId, undefined, '❌ Gagal ambil anime.\n`' + err.message + '`', { parse_mode: 'Markdown', reply_markup: keyboard }); } 
      catch (e) { console.error(e.message); }
    }
  }
}
