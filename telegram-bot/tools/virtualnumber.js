const API_BASE = 'https://api.synoxcloud.xyz/tools/virtual-numbers';
const API_KEY = 'FREE';

export const meta = {
  id: 'virtualnumber',
  label: '📱 Virtual Number',
  description: 'Ambil nomor virtual sekali pakai',
};

export async function open(ctx) {
  await ctx.answerCbQuery();
  const keyboard = { inline_keyboard: [[{ text: '🔄 Ambil Lagi', callback_data: 'virtualnumber' }], [{ text: '⬅️ Kembali', callback_data: 'back' }]] };
  
  const setText = async (text) => {
    try { await ctx.editMessageCaption(text, { parse_mode: 'Markdown', reply_markup: keyboard }); } 
    catch { await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: keyboard, disable_web_page_preview: true }); }
  };

  await setText('📱 *Virtual Number*\n\nLagi ambil nomor sekali pakai...');

  try {
    const res = await fetch(`${API_BASE}?apikey=${API_KEY}`);
    const data = await res.json();

    if (!data?.status) {
      await setText('❌ Gagal ambil nomor.\n`' + JSON.stringify(data).slice(0, 300) + '`');
      return;
    }

    const r = data.result || data;
    const numbers = Array.isArray(r) ? r : r.numbers || [r];
    if (numbers.length === 0) { await setText('❌ Nggak ada nomor tersedia.'); return; }

    let caption = `📱 *Virtual Numbers*\n\nTotal: *${numbers.length}*\n\n`;
    numbers.slice(0, 10).forEach((n, i) => {
      const num = n.number || n.phone || n;
      const country = n.country ? ` (${n.country})` : '';
      const service = n.service ? ` • ${n.service}` : '';
      caption += `*${i + 1}.* \`${num}\`${country}${service}\n`;
    });
    if (numbers.length > 10) caption += `\n_...dan ${numbers.length - 10} nomor lainnya_`;
    
    await setText(caption);
  } catch (err) {
    await setText('❌ Error: `' + (err.message ?? 'unknown') + '`');
  }
}
