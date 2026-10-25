const API_URL = 'https://api.ikyyxd.my.id/edit/remove-clothesv2';

const RAW_KEYS = process.env.IKY_KEYS || '';
const API_KEYS = RAW_KEYS.split(',').map(k => k.trim()).filter(k => k);

let currentKeyIndex = 0;

export const pendingRemoveClothes = new Set();

export const meta = {
  id: 'removeclothes',
  label: '👙 Remove Clothes',
  description: 'Edit gambar (remove clothes) via URL',
};

export async function open(ctx) {
  await ctx.answerCbQuery();
  pendingRemoveClothes.add(ctx.chat.id);

  const text = '👙 *Remove Clothes*\n\nKirim link URL gambar yang mau diedit.\nPastiin link-nya direct link (berakhiran .jpg/.png).';
  const keyboard = { inline_keyboard: [[{ text: '⬅️ Kembali', callback_data: 'back' }]] };

  try {
    await ctx.editMessageCaption(text, { parse_mode: 'Markdown', reply_markup: keyboard });
  } catch {
    await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: keyboard });
  }
}

export async function handleText(ctx) {
  const chatId = ctx.chat.id;
  if (!pendingRemoveClothes.has(chatId)) return false;

  const text = (ctx.message.text || '').trim();
  if (!text) return false;

  if (!/^https?:\/\//i.test(text)) {
    await ctx.reply('❌ Itu bukan link gambar valid, bos.\nHarus mulai dari `http://` atau `https://`', { parse_mode: 'Markdown' });
    return true;
  }

  if (API_KEYS.length === 0) {
    await ctx.reply('❌ Key API belum diset di .env (IKY_KEYS), bos.', { parse_mode: 'Markdown' });
    return true;
  }

  pendingRemoveClothes.delete(chatId);
  const loading = await ctx.reply('⏳ Lagi diproses, API ini suka lama (bisa 15-20 detik), sabar ya...');

  const keyboard = { inline_keyboard: [[{ text: '🔄 Edit Lagi', callback_data: 'removeclothes' }], [{ text: '⬅️ Kembali', callback_data: 'back' }]] };

  let success = false;
  let lastError = '';
  
  for (let attempt = 0; attempt < API_KEYS.length; attempt++) {
    const key = API_KEYS[currentKeyIndex];
    
    try {
      const fetchUrl = `${API_URL}?url=${encodeURIComponent(text)}&key=${encodeURIComponent(key)}`;
      
      const res = await fetch(fetchUrl, {
        method: 'GET',
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(30000) 
      });

      const data = await res.json();

      if (data.status === false) {
        throw new Error(data.message || 'API mengembalikan status false');
      }

      const resultUrl = data.result?.result_url;
      
      if (!resultUrl) {
        throw new Error('Response sukses tapi `result_url` tidak ditemukan.');
      }

      await ctx.telegram.editMessageMedia(
        chatId, loading.message_id, undefined,
        { 
          type: 'photo', 
          media: resultUrl, 
          caption: `✅ *Berhasil Diedit!*\n\nSisa limit key ini: \`${data.remaining_limit ?? '?'}\``, 
          parse_mode: 'Markdown' 
        },
        { reply_markup: keyboard }
      );
      
      success = true;
      break; 

    } catch (err) {
      lastError = err.message;
      console.log(`[Key ${currentKeyIndex + 1}] Gagal: ${lastError}. Ganti key...`);
      currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    }
  }

  if (!success) {
    await ctx.telegram.editMessageText(
      chatId, loading.message_id, undefined,
      '❌ *Semua Key Gagal / Limit.*\n\n' +
      `Error terakhir: \`${lastError}\`\n\n` +
      '_Coba lagi nanti atau generate key baru._',
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  }

  return true;
}
