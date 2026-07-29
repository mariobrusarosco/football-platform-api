# Environment Configuration

This project has three runtime contexts. The same setting keeps the same name everywhere; only
its value changes by environment.

| Context | Where values are stored | Values |
| --- | --- | --- |
| Local API | `.env` (not committed) | `DATABASE_URL`, `CORS_ORIGIN`, `ASSET_BASE_URL` |
| Demo or staging API | Cloudflare Worker **Variables and secrets** | `DATABASE_URL`, `CORS_ORIGIN`, `ASSET_BASE_URL` |
| Deployment workflow | GitHub Environment | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `DATABASE_URL` for migrations |

There is no automatic sync between these places. They are three different processes:

```text
local Node API       reads .env
Cloudflare API       reads its Worker settings
GitHub deploy job    reads its GitHub Environment
```

## Cloudflare: deployed API configuration

For each deployed Worker (for example `football-platform-api-demo` or a future
`football-platform-api-staging`), open **Workers & Pages → Worker → Settings → Variables and
secrets** and set:

| Name | Type | Demo value |
| --- | --- | --- |
| `ASSET_BASE_URL` | Plaintext variable | `https://pub-ad9a25475486494b8665c0b11bd920ca.r2.dev` |
| `CORS_ORIGIN` | Plaintext variable | `https://wc-almanac.netlify.app` |
| `DATABASE_URL` | Secret | The database connection URL for that environment |

`DATABASE_URL` must be a **Secret**, not a plaintext variable. It is a credential. Re-enter the
existing value as a Secret, then delete the plaintext entry.

`wrangler.toml` deliberately does **not** contain these values. It has `keep_vars = true`, which
means deployments preserve the values configured in the Cloudflare dashboard. Cloudflare calls
this out as the correct option when variables are dashboard-managed.

The Worker forwards those three values through `envVars` to the Node API container. That is
required by Cloudflare Containers: the Worker and the container are separate runtimes. It is not
another place to configure values.

## GitHub: deploy and migrations

The `demo` GitHub Environment supplies:

| Name | Why GitHub needs it |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Authorizes Wrangler to deploy the Worker |
| `CLOUDFLARE_ACCOUNT_ID` | Selects the Cloudflare account |
| `DATABASE_URL` | Lets the workflow run `pnpm db:migrate` before deployment |

The database URL appears in both GitHub and Cloudflare because two different processes use it:
GitHub runs migrations; the deployed API serves requests. Use the same environment's database,
but store it separately in each provider's secret store.

If automated migrations are removed from the GitHub workflow, remove GitHub's `DATABASE_URL` too.

## Adding staging

Do not rename variables. Create a staging Worker and a staging GitHub Environment, then use the
same names with staging values:

```text
Cloudflare Worker: football-platform-api-staging
  DATABASE_URL     staging database secret
  CORS_ORIGIN      staging frontend URL
  ASSET_BASE_URL   staging asset URL

GitHub Environment: staging
  CLOUDFLARE_API_TOKEN
  CLOUDFLARE_ACCOUNT_ID
  DATABASE_URL     staging database URL, only for migrations
```

## Sources

- [Cloudflare: environment variables](https://developers.cloudflare.com/workers/configuration/environment-variables/)
- [Cloudflare: Wrangler configuration and `keep_vars`](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [Cloudflare Containers: environment variables and secrets](https://developers.cloudflare.com/containers/examples/env-vars-and-secrets/)
- [Cloudflare Wrangler GitHub Action](https://github.com/cloudflare/wrangler-action)
