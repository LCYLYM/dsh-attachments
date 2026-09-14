export const PREFERENCE_KEY = 'better-attach.preferences.v1';
export const DEFAULT_PREFERENCES = Object.freeze({mode:'copy',theme:'plain'});
export function normalizePreferences(value) {
  return {mode:value?.mode==='path'?'path':'copy',theme:['plain','official','character'].includes(value?.theme)?value.theme:'plain'};
}
export function readPreferences(storage) {
  try { return normalizePreferences(JSON.parse((storage??globalThis.localStorage).getItem(PREFERENCE_KEY))); }
  catch { return {...DEFAULT_PREFERENCES}; }
}
export function writePreferences(value,storage=globalThis.localStorage) {
  const next=normalizePreferences(value);storage.setItem(PREFERENCE_KEY,JSON.stringify(next));return next;
}
export function fileGlyph(item) {
  const name=(item?.path??item?.name??'').toLowerCase();
  if(/\.(png|jpe?g|gif|webp|bmp|avif)$/.test(name))return 'image';
  if(/\.(pdf|docx?|odt|rtf)$/.test(name))return 'document';
  if(/\.(xlsx?|csv|tsv|ods)$/.test(name))return 'table';
  if(/\.(zip|tar|gz|7z|rar|bz2|xz)$/.test(name))return 'archive';
  if(/\.(mp3|wav|ogg|flac|m4a)$/.test(name))return 'audio';
  if(/\.(mp4|webm|mov|mkv)$/.test(name))return 'video';
  if(/\.(js|ts|tsx|jsx|py|c|h|cpp|rs|go|java|sv|v|json|ya?ml|toml|sh|html|css|sql)$/.test(name))return 'code';
  return 'file';
}
