# Opportunity Hub

A responsive Next.js site for discovering careers, events, and local connections in the Palatine community. Opportunity listings and community member records are stored in MongoDB.

## Run locally

1. Install Node.js and start the local MongoDB service.
2. Install dependencies and start the site:

   ```powershell
   npm install
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000).

The app connects to `mongodb://127.0.0.1:27017` and uses the `opportunity_hub` database by default. On the first database request it creates the `opportunities`, `members`, and `app_metadata` collections, adds indexes, and seeds the existing preview listings and members if the collections are empty.

To use a different local MongoDB URI or database name, copy `.env.example` to `.env.local` and update `MONGODB_URI` and `MONGODB_DATABASE`.

The development and production servers bind to `127.0.0.1` so the unauthenticated admin workspace stays local. Public opportunity submissions are stored as active listings and appear on the site. Listings created from the admin workspace start as pending; publishing, pausing, and deleting listings update MongoDB. Do not expose this server or its admin API to a network or public deployment.

## Verify and build

```bash
npm run lint
npm run build
```
