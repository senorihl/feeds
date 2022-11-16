declare var self: ServiceWorkerGlobalScope;
export {};

const swScriptUrl = new URL(self.location.toString());
const basePath    = swScriptUrl.origin + swScriptUrl.searchParams.get('pathname');
const CACHE_NAME = `FEEDS_CACHE_${swScriptUrl.searchParams.get('rand') || 'undefined'}`;


const addResourcesToCache = async (resources: string[]) => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(resources);
};

self.addEventListener("install", (event) => {
    console.log('SW install')
    event.waitUntil(
        addResourcesToCache([
            `${basePath}`,
            `${basePath}main.js`,
            `${basePath}main.css`,
        ])
    )

});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then(function(cacheResponse) {
                // Cache hit - return response
                if (cacheResponse && !event.request.url.startsWith(__PROXY__)) {
                    // console.log(event.request.url, 'from cache')
                    return cacheResponse;
                }

                // IMPORTANT: Cloner la requête.
                // Une requete est un flux et est à consommation unique
                // Il est donc nécessaire de copier la requete pour pouvoir l'utiliser et la servir
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then(
                    function(networkResponse) {
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            if (event.request.url.startsWith(__PROXY__)) {
                                // console.log(event.request.url, !cacheResponse ? 'from network' : 'from cache')
                                return cacheResponse || networkResponse;
                            } else {
                                // console.log(event.request.url, 'from network')
                                return networkResponse;
                            }
                        }

                        // IMPORTANT: Même constat qu'au dessus, mais pour la mettre en cache
                        const responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then(function(cache) {
                                cache.put(event.request, responseToCache);
                            });

                        // console.log(event.request.url,  'from network')
                        return networkResponse;
                    }
                );
            })
    );
});
