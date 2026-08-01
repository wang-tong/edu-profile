// Service Worker — 缓存页面实现离线打开
var CACHE = 'edu-v3';

var FILES = [
  '/edu-profile/',
  '/edu-profile/index.html',
  '/edu-profile/report.html',
  'https://cdn.jsdelivr.net/npm/lz-string@1.5.0/libs/lz-string.min.js'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) {
      return c.addAll(FILES);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) {
        return k !== CACHE;
      }).map(function(k) {
        return caches.delete(k);
      }));
    })
  );
});

self.addEventListener('fetch', function(e) {
  // 只缓存GET请求
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      // 缓存命中直接用,否则联网获取并缓存
      var fetched = fetch(e.request).then(function(resp) {
        if (resp && resp.status === 200) {
          var clone = resp.clone();
          caches.open(CACHE).then(function(c) {
            c.put(e.request, clone);
          });
        }
        return resp;
      }).catch(function() {
        // 离线且无缓存时返回缓存备用
        return cached;
      });
      return cached || fetched;
    })
  );
});
