K6 and Postman tests

Run Newman smoke tests locally:

```bash
npm ci
npx newman run load-tests/postman_collection.json --env-var "baseUrl=http://localhost:4000"
```

Run k6 locally:

```bash
# install k6 (linux)
# sudo apt-get install -y k6
k6 run -e TARGET_URL=http://localhost:4000 load-tests/k6-load-test.js
```

In CI set `RUN_SMOKE` and `RUN_LOAD` env variables to `true` and set `STAGING_URL` to the staging host.
