# @weverse-shop/core

Core API client for fetching Weverse Shop product data. Handles buildId caching, data fetching, and response parsing with Zod validation.

## Usage

```typescript
import { getSale } from '@weverse-shop/core'

// You can obtain saleId from the item url, it should be in this format
// https://shop.weverse.io/local/.../sales/{saleId} or
// https://https://share.weverseshop.io/static/shares/sale/{saleId}
const sale = await getSale(12345, {
  locale: 'zh-tw',
  currency: 'KRW',
})

console.log(sale.title)
console.log(sale.price)
console.log(sale.option.options)
```

## How does it work?

Weverse Shop uses next.js 12 as their frontend framework. While most sales content are sever-side generated, we can still get somewhat clean and sturctured data from their `getServerSideProps` response from `https://shop.weverse.io/__next/{buildId}/{...route}.json`.

Since `buildId` will change when the site is redeployed, we must fetch the HTML version first to extract the build id from `<script>` tags.

While we can see some kind of internal api endpoints in the `queryKey` section (such as `/api/v1/sales/:saleId`), sadly I couldn't find endpoints to actually hit this api (it should only accept internal traffics anyway...), so extracting next.js `pageProps` is the best solution that I've found so far.

```json
{
  "pageProps": {
    "initialDisplayUserCountry": "TW",
    "serverCookies": {...},
    "$disableLayout": false,
    "inWebview": false,
    "viewerCountry": "TW",
    "refererFromServerSide": "",
    "displayPlatform": "WEB",
    "$dehydratedState": {
      "mutations": [],
      "queries": [
        {
          "state": {
            "data": [...]
            "dataUpdateCount": 1,
            "dataUpdatedAt": 1768835555570,
            "error": null,
            "errorUpdateCount": 0,
            "errorUpdatedAt": 0,
            "fetchFailureCount": 0,
            "fetchMeta": null,
            "isFetching": false,
            "isInvalidated": false,
            "isPaused": false,
            "status": "success"
          },
          "queryKey": ["GET:/api/v1/settings/artists", null],
          "queryHash": "[\"GET:/api/v1/settings/artists\",null]"
        },
        {
          "state": {
            "data": {...},
            "dataUpdateCount": 1,
            "dataUpdatedAt": 1768835555574,
            "error": null,
            "errorUpdateCount": 0,
            "errorUpdatedAt": 0,
            "fetchFailureCount": 0,
            "fetchMeta": null,
            "isFetching": false,
            "isInvalidated": false,
            "isPaused": false,
            "status": "success"
          },
          "queryKey": ["GET:/api/v1/settings/languages", null],
          "queryHash": "[\"GET:/api/v1/settings/languages\",null]"
        },
        {
          "state": {
            "data": {...},
            "dataUpdateCount": 1,
            "dataUpdatedAt": 1768835555574,
            "error": null,
            "errorUpdateCount": 0,
            "errorUpdatedAt": 0,
            "fetchFailureCount": 0,
            "fetchMeta": null,
            "isFetching": false,
            "isInvalidated": false,
            "isPaused": false,
            "status": "success"
          },
          "queryKey": ["GET:/api/v1/settings/currencies", null],
          "queryHash": "[\"GET:/api/v1/settings/currencies\",null]"
        },
        {
          "state": {
            "data": {...},
            "dataUpdateCount": 2,
            "dataUpdatedAt": 1768835555584,
            "error": null,
            "errorUpdateCount": 0,
            "errorUpdatedAt": 0,
            "fetchFailureCount": 0,
            "fetchMeta": null,
            "isFetching": false,
            "isInvalidated": false,
            "isPaused": false,
            "status": "success"
          },
          "queryKey": [
            "GET:/api/v1/sales/:saleId",
            {
              "saleId": 51621,
              "displayPlatform": "WEB"
            }
          ],
          "queryHash": "[\"GET:/api/v1/sales/:saleId\",{\"displayPlatform\":\"WEB\",\"saleId\":51621}]"
        }
      ]
    },
    "_nextI18Next": {...}
  },
  "__N_SSP": true
}
```

## Development

```bash
bun run src/index.ts
```
