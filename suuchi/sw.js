// 数値マネージャー：オフライン用（同じサイト内のこのフォルダのファイルだけを保存。外部には一切アクセスしない）
// アプリを更新したら VERSION の数字を1つ上げてください。
const VERSION = 'v6';
const CACHE = 'suuchi-' + VERSION;
const CORE = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-180.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {}));
  self.skipWaiting();
});
// 消すのは自分の古いキャッシュだけ（シフトマネージャー・翌月予測のキャッシュには触らない）
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('suuchi-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  const base = new URL('./', self.registration.scope).pathname;
  if (!url.pathname.startsWith(base)) return;
  // つながっていれば最新、つながらなければ保存済み
  e.respondWith(fetch(req.mode === 'navigate' ? req.url : req, { cache: 'no-cache' }).then(r => {
    if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(req.mode === 'navigate' ? './index.html' : req, c)); }
    return r;
  }).catch(() => caches.match(req.mode === 'navigate' ? './index.html' : req, { ignoreSearch: true }).then(m => m || caches.match('./index.html'))));
});
