const API_BASE = 'https://api.synoxcloud.xyz/search/ampreset';
const API_KEY = 'FREE';

export const pendingAmpreset = new Set();

export const meta = {
  id: 'ampreset',
  label: '🎬 AMPreset Finder',
  description: 'Ambil preset Alight Motion dari link TikTok',
};

function fmtNum(n) {
  if (n == null) return '-';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

function esc(s) {
  if (!s) return '';
  return String(s).replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

export async function open(ctx) {
  await ctx.answerCbQuery();
  pendingAmpreset.add(ctx.chat.id);
  const text = '🎬 *AMPreset Finder*\n\nKirim link video TikTok-nya.\nContoh: `https://vt.tiktok.com/ZSbmR9kCu/`';
  const keyboard = { inline_keyboard: [[{ text: '⬅️ Kembali', callback_data: 'back' }]] };
  try {
    await ctx.editMessageCaption(text, { parse_mode: 'Markdown', reply_markup: keyboard });
  } catch {
    await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: keyboard });
  }
}

export async function handleText(ctx) {
  const chatId = ctx.chat.id;
  if (!pendingAmpreset.has(chatId)) return false;

  const text = (ctx.message.text || '').trim();
  if (!text) return false;

  if (!/tiktok\.com/i.test(text)) {
    await ctx.reply('❌ Itu bukan link TikTok, bos.', { parse_mode: 'Markdown' });
    return true;
  }

  pendingAmpreset.delete(chatId);
  const loading = await ctx.reply('⏳ Lagi scan preset-nya, sabar...');

  try {
    const url = `${API_BASE}?url=${encodeURIComponent(text)}&apikey=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data?.status || !data?.result) {
      await ctx.telegram.editMessageText(chatId, loading.message_id, undefined, '❌ Gagal ambil preset, bos.\n`' + JSON.stringify(data).slice(0, 300) + '`', { parse_mode: 'Markdown' });
      return true;
    }

    const r = data.result;
    const v = r.video || {};
    const stats = v.stats || {};
    const presets = r.presetLinks || [];

    let caption = `🎬 *AMPreset Finder*\n\n👤 Author: *${esc(r.nickname || r.author || '-')}* (@${esc(r.author || '-')})\n👁 Views: \`${fmtNum(stats.views)}\`  ❤️ \`${fmtNum(stats.likes)}\`  💬 \`${fmtNum(stats.comments)}\`  🔁 \`${fmtNum(stats.shares)}\`\n📦 Total preset: *${r.total ?? presets.length}*\n`;
    if (r.scanned) caption += `🔎 Scanned comments: \`${r.scanned.comments ?? 0}\`, replies: \`${r.scanned.replies ?? 0}\`\n`;
    caption += `\n━━━━━━━━━━━━━━\n`;

    if (presets.length === 0) {
      caption += `\n_Nggak ada preset yang ketemu di komentar._`;
    } else {
      presets.forEach((p, i) => {
        const title = esc(p.title || `Preset ${i + 1}`);
        const type = p.type ? ` [${esc(p.type)}]` : '';
        const size = p.size ? ` • ${esc(p.size)}` : '';
        const by = p.byAuthor ? ' 👑' : '';
        caption += `\n*${i + 1}. ${title}*${type}${size}${by}\n   🔗 ${p.url}\n`;
      });
    }

    const buttons = [];
    if (v.url) buttons.push([{ text: '▶️ Buka Video TikTok', url: v.url }]);
    presets.forEach((p, i) => { buttons.push([{ text: `📥 ${p.title || 'Preset ' + (i + 1)}`.slice(0, 60), url: p.url }]); });
    buttons.push([{ text: '⬅️ Kembali', callback_data: 'back' }]);

    if (v.cover) {
      try {
        await ctx.telegram.editMessageMedia(chatId, loading.message_id, undefined, { type: 'photo', media: v.cover, caption, parse_mode: 'Markdown' }, { reply_markup: { inline_keyboard: buttons } });
        return true;
      } catch (e) { console.warn('editMessageMedia gagal:', e.message); }
    }

    await ctx.telegram.editMessageText(chatId, loading.message_id, undefined, caption, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: buttons }, disable_web_page_preview: true });
  } catch (err) {
    await ctx.telegram.editMessageText(chatId, loading.message_id, undefined, '❌ Error: `' + esc(err.message ?? 'unknown') + '`', { parse_mode: 'Markdown' });
  }
  return true;
}
