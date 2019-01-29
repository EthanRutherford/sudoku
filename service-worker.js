/* global importScripts workbox */
importScripts("https://storage.googleapis.com/workbox-cdn/releases/3.6.1/workbox-sw.js");

// cache the Google Fonts stylesheets
workbox.routing.registerRoute(
	/^https:\/\/fonts\.googleapis\.com/,
	workbox.strategies.staleWhileRevalidate({
		cacheName: "google-fonts-stylesheets",
	}),
);

// cache the Google Fonts webfont files
workbox.routing.registerRoute(
	/^https:\/\/fonts\.gstatic\.com/,
	workbox.strategies.cacheFirst({
		cacheName: "google-fonts-webfonts",
		plugins: [
			new workbox.cacheableResponse.Plugin({
				statuses: [0, 200],
			}),
			new workbox.expiration.Plugin({
				maxAgeSeconds: 60 * 60 * 24 * 365,
			}),
		],
	}),
);

// cache the application code
workbox.routing.registerRoute(
	/(?:\.js|\.css|\/)$/,
	workbox.strategies.staleWhileRevalidate({
		cacheName: "sudoku-application-code",
		plugins: [
			new workbox.broadcastUpdate.Plugin("code-updates"),
		],
	}),
);

// prefill application cache
self.addEventListener("install", (event) => {
	const urls = [
		"/",
		"/dist/main.js",
		"/dist/styles.css",
		"/dist/worker.js",
	];

	event.waitUntil(caches.open("sudoku-application-code").then(
		(cache) => cache.addAll(urls),
	));
});
