import http from 'node:http';

async function main() {
  let handler;
  try {
    const mod = await import('./.vercel/output/functions/ssr.func/index.mjs');
    handler = mod.default;
  } catch (err) {
    console.error('Failed to import built SSR handler. Did you run `npm run build`?');
    console.error(err);
    process.exit(1);
  }

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;

  const server = http.createServer((req, res) => {
    // handler may return a promise
    Promise.resolve()
      .then(() => handler(req, res))
      .catch((err) => {
        console.error('Handler error:', err);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.end('Internal Server Error');
        } else {
          try { res.end(); } catch {};
        }
      });
  });

  server.listen(port, () => {
    console.log(`Railway start: listening on http://0.0.0.0:${port}`);
  });
}

main();
