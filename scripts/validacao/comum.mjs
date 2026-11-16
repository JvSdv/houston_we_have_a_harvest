// Utilitários dos testes de validação: cache em disco, fetch com novas tentativas e pausas.
import fs from "node:fs";
import path from "node:path";

export const CACHE = path.resolve(".cache/validacao");
fs.mkdirSync(CACHE, { recursive: true });

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Busca texto com cache em disco (arquivo = chave). `vazioOk`: 404 vira "" (ex.: ano sem dados na estação). */
export async function buscarTexto(url, chave, { tentativas = 4, pausa = 0, vazioOk = false } = {}) {
  const arq = path.join(CACHE, chave);
  if (fs.existsSync(arq)) return fs.readFileSync(arq, "utf8");
  fs.mkdirSync(path.dirname(arq), { recursive: true });
  for (let i = 1; i <= tentativas; i++) {
    try {
      const r = await fetch(url);
      if (r.status === 404 && vazioOk) {
        fs.writeFileSync(arq, "");
        return "";
      }
      // limite de uso da API: espera um minuto e tenta de novo (não conta como tentativa)
      if (r.status === 429) {
        console.log("  (limite da API, esperando 65 s)");
        await sleep(65_000);
        i--;
        continue;
      }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const txt = await r.text();
      fs.writeFileSync(arq, txt);
      if (pausa) await sleep(pausa);
      return txt;
    } catch (e) {
      if (i === tentativas) throw new Error(`${url}: ${e.message}`);
      await sleep(2000 * i);
    }
  }
}

/** Como buscarTexto, mas exige JSON válido: resposta quebrada (ex.: tempo esgotado no servidor) é apagada e buscada de novo. */
export async function buscarJson(url, chave, op) {
  for (let i = 1; ; i++) {
    const txt = await buscarTexto(url, chave, op);
    try {
      return JSON.parse(txt);
    } catch (e) {
      fs.rmSync(path.join(CACHE, chave), { force: true });
      if (i >= 4) throw new Error(`${url}: resposta não é JSON (${e.message})`);
      await sleep(5000 * i);
    }
  }
}

export function salvarJson(arq, obj) {
  fs.mkdirSync(path.dirname(arq), { recursive: true });
  fs.writeFileSync(arq, JSON.stringify(obj, null, 1));
}

/** CSV simples com aspas (formato GSOD). */
export function lerCsv(txt) {
  const linhas = txt.trim().split(/\r?\n/);
  if (linhas.length < 2) return [];
  const campos = (l) => l.match(/("([^"]*)"|[^,]+|(?<=,)(?=,|$))/g).map((c) => c.replace(/^"|"$/g, "").trim());
  const cab = campos(linhas[0]);
  return linhas.slice(1).map((l) => {
    const v = campos(l);
    return Object.fromEntries(cab.map((k, i) => [k, v[i]]));
  });
}

export const media = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);

/** Gerador pseudoaleatório com semente (permutações reprodutíveis). */
export function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
