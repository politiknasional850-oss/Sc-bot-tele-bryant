const KEY = 'AIzaBj7z2z3xBjsk';
const DOMAIN = 'https://c.termai.cc';

export const pendingUpload = new Set();

export const meta = {
  id: 'fotolink',
  label: '🖼 Foto to Link',
  description: 'Upload foto jadi link',
};

export async function open(ctx) {
  await ctx.answerCbQuery();
  pendingUpload.add(ctx.chat.id);

  const text = '🖼 *Foto to Link*\n\nKirim foto yang mau di-upload.\nBot bakal balikin link-nya.';
  const keyboard = { inline_keyboard: [[{ text: '⬅️ Kembali', callback_data: 'back' }]] };

  try {
    await ctx.editMessageCaption(text, { parse_mode: 'Markdown', reply_markup: keyboard });
  } catch {
    await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: keyboard });
  }
}

export async function handlePhoto(ctx) {
  const chatId = ctx.chat.id;
  if (!pendingUpload.has(chatId)) return false;
  pendingUpload.delete(chatId);

  try {
    const best = ctx.message.photo[ctx.message.photo.length - 1];
    const fileLink = await ctx.telegram.getFileLink(best.file_id);
    
    const dlRes = await fetch(fileLink.href);
    const arrayBuf = await dlRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    
    const ct = dlRes.headers.get('content-type') || 'image/jpeg';
    let ext = ct.split('/')[1]?.split(';')[0] || 'jpg';
    if (ext === 'octet-stream' || ext === 'jpeg') ext = 'jpg';
    if (ext === 'png') ext = 'png';

    const form = new FormData();
    form.append('file', new Blob([buffer], { type: `image/${ext === 'jpg' ? 'jpeg' : ext}` }), `image.${ext}`);

    const upRes = await fetch(`${DOMAIN}/api/upload?key=${KEY}`, {
      method: 'POST',
      body: form,
    });

    const result = await upRes.json();

    if (!result?.status) {
      await ctx.reply('❌ Upload gagal, bos.\n`' + JSON.stringify(result) + '`', { parse_mode: 'Markdown' });
      return true;
    }

    let finalLink = result.path;
    if (finalLink && finalLink.endsWith('.octet-stream')) {
      finalLink = finalLink.replace('.octet-stream', `.${ext}`);
    }

    const text = '✅ *Upload sukses!*\n\n' +
      `🔗 Link: ${finalLink}\n` +
      `📦 Size: \`${(result.size / 1024).toFixed(2)} KB\`\n` +
      `📄 Type: \`${result.mimetype}\`\n\n` +
      `_Note: Jika link tidak bisa di-preview, coba buka pake browser lain._`;

    await ctx.reply(text, { parse_mode: 'Markdown', disable_web_page_preview: true });
  } catch (err) {
    console.error('fotolink error:', err.message);
    await ctx.reply('❌ Gagal upload, bos.\n`' + (err.message ?? 'unknown') + '`', { parse_mode: 'Markdown' });
  }
  return true;
        }
