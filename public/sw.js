// Service worker do weharvest: rede primeiro, cópia guardada se o sinal cair.
// Só guarda arquivos do próprio site (nada de NASA/Open-Meteo, que mudam e têm dados do lugar).
const CACHE = "weharvest-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(req)
      .then((resp) => {
        if (resp.ok) {
          const copia = resp.clone();
          caches.open(CACHE).then((c) => c.put(req, copia));
        }
        return resp;
      })
      .catch(async () => {
        const guardado = await caches.match(req, { ignoreSearch: req.mode === "navigate" });
        if (guardado) return guardado;
        if (req.mode === "navigate") {
          const inicio = await caches.match("/");
          if (inicio) return inicio;
        }
        return Response.error();
      }),
  );
});
