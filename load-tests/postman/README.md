Postman / Newman API smoke tests

Prerequisites

- Node.js and npm installed
- The API running locally (default: `http://localhost:4000`)
- `newman` installed globally or as a dev dependency

Install newman (global)

```bash
npm install -g newman
```

Run the collection against local API

```bash
cd load-tests
newman run postman_collection.json
```

Run with a different base URL

```bash
newman run postman_collection.json --env-var "baseUrl=https://staging.example.com"
```

Integrating into CI

- Add `newman` to devDependencies and run `npx newman run ...` in your CI pipeline after starting the API or hitting the staging URL.
