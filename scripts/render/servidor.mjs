// Servidor estático mínimo (raiz do repo) para a página de render da sequência.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '../..');
const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.glb': 'model/gltf-binary',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.hdr': 'application/octet-stream',
};

export function servir(porta) {
  const servidor = createServer(async (req, res) => {
    const caminho = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
    const arquivo = join(RAIZ, caminho);
    if (!arquivo.startsWith(RAIZ)) return res.writeHead(403).end();
    try {
      const corpo = await readFile(arquivo);
      res.writeHead(200, { 'Content-Type': TIPOS[extname(arquivo)] ?? 'application/octet-stream' }).end(corpo);
    } catch {
      res.writeHead(404).end();
    }
  });
  return new Promise((ok) => servidor.listen(porta, '127.0.0.1', () => ok(servidor)));
}
