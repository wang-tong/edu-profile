// Service Worker — 缓存页面实现离线打开
var CACHE = 'edu-v4';

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
      // 网络优先: 先尝试网络,失败后回退缓存(离线可用)
      return fetch(e.request).then(function(resp) {
        if (resp && resp.status === 200) {
          caches.open(CACHE).then(function(c) {
            c.put(e.request, resp.clone());
          });
        }
        return resp;
      }).catch(function() {
        return cached;
      });
    })
  );
});
