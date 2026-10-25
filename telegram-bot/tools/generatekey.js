const API_URL = 'https://api.ikyyxd.my.id/X-App-key';

export const meta = {
  id: 'generatekey',
  label: '🔑 Generate API Key',
  description: 'Bikin API Key IkyyXD baru',
};

export async function open(ctx) {
  await ctx.answerCbQuery();
  
  const keyboard = {
    inline_keyboard: [
      [{ text: '🔄 Generate Lagi', callback_data: 'generatekey' }],
      [{ text: '⬅️ Kembali', callback_data: 'back' }]
    ],
  };

  try {
    await ctx.editMessageCaption('⏳ Sedang generate API Key baru...', {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  } catch {
    await ctx.editMessageText('⏳ Sedang generate API Key baru...', {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  }

  try {
    const res = await fetch(API_URL, { method: 'GET' });
    const data = await res.json();

    let caption = '';

    if (data.status === true || data.success === true || data.key) {
      const apiKey = data.key || data.apikey || data.result?.key || JSON.stringify(data);
      caption =
        '✅ *Generate Berhasil!*\n\n' +
        `🔑 *API Key Baru:*\n\`${apiKey}\`\n\n` +
        `_Copy key di atas, lalu tambahkan ke file .env (IKY_KEYS)._`;
    } else {
      caption = '❌ *Gagal Generate Key.*\n\n`' + JSON.stringify(data).slice(0, 300) + '`';
    }

    await ctx.telegram.editMessageText(
      ctx.chat.id,
      ctx.callbackQuery.message.message_id,
      undefined,
      caption,
      { parse_mode: 'Markdown', reply_markup: keyboard, disable_web_page_preview: true }
    );

  } catch (err) {
    console.error('generatekey error:', err);
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      ctx.callbackQuery.message.message_id,
      undefined,
      '❌ Error: `' + err.message + '`',
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  }
}
