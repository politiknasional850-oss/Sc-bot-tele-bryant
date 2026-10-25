const API_BASE = 'https://api.synoxcloud.xyz/tools/otp-checker';
const API_KEY = 'FREE';

export const pendingOtp = new Set();

export const meta = {
  id: 'otpchecker',
  label: '🔐 OTP Checker',
  description: 'Cek OTP dari nomor virtual',
};

export async function open(ctx) {
  await ctx.answerCbQuery();
  pendingOtp.add(ctx.chat.id);
  const text = '🔐 *OTP Checker*\n\nKirim nomor virtual yang mau di-cek OTP-nya.\nContoh: `+6281234567890`';
  const keyboard = { inline_keyboard: [[{ text: '⬅️ Kembali', callback_data: 'back' }]] };
  try { await ctx.editMessageCaption(text, { parse_mode: 'Markdown', reply_markup: keyboard }); } 
  catch { await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: keyboard }); }
}

export async function handleText(ctx) {
  const chatId = ctx.chat.id;
  if (!pendingOtp.has(chatId)) return false;

  const text = (ctx.message.text || '').trim();
  if (!text) return false;

  const digits = text.replace(/\D/g, '');
  if (digits.length < 8) {
    await ctx.reply('❌ Nomor nggak valid, bos.\nContoh: `+6281234567890`', { parse_mode: 'Markdown' });
    return true;
  }

  pendingOtp.delete(chatId);
  let number = text.startsWith('+') ? text : '+' + digits;
  const loading = await ctx.reply('⏳ Lagi cek OTP, sabar...');
  const keyboard = { inline_keyboard: [[{ text: '🔄 Cek Lagi', callback_data: 'otpchecker' }], [{ text: '⬅️ Kembali', callback_data: 'back' }]] };

  try {
    const url = `${API_BASE}?number=${encodeURIComponent(number)}&apikey=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    let caption;
    if (!data?.status) {
      caption = '❌ Gagal cek OTP.\n`' + JSON.stringify(data).slice(0, 300) + '`';
    } else {
      const r = data.result || data;
      const messages = Array.isArray(r) ? r : r.messages || (r.otp ? [r] : []);
      caption = `🔐 *OTP Checker*\n📱 Nomor: \`${number}\`\n\n`;
      if (messages.length === 0) {
        caption += '_Belum ada OTP masuk._';
      } else {
        caption += `Total: *${messages.length}*\n\n`;
        messages.slice(0, 10).forEach((m, i) => {
          const otp = m.otp || m.code || m.message || m.text || '-';
          const service = m.service ? ` [${m.service}]` : '';
          const time = m.time || m.timestamp || m.created_at || '';
          caption += `*${i + 1}.*${service} \`${otp}\`\n`;
          if (time) caption += `   🕐 ${time}\n`;
        });
      }
    }
    await ctx.telegram.editMessageText(chatId, loading.message_id, undefined, caption, { parse_mode: 'Markdown', reply_markup: keyboard, disable_web_page_preview: true });
  } catch (err) {
    await ctx.telegram.editMessageText(chatId, loading.message_id, undefined, '❌ Error: `' + (err.message ?? 'unknown') + '`', { parse_mode: 'Markdown' });
  }
  return true;
}
