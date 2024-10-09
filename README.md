This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

I followed the tutorial [here](https://www.telerik.com/blogs/integrate-serverless-sql-database-vercel-postgres) with some minor changes.

- `npx create-next-app` with name: calculation-brainstorm
- push repo to github
- deploy repo on Vercel by adding a new Project which imports the github repo
- create a Postgres database and connect it to the Project
- `npm i -g vercel@latest`
- `npm i @vercel/postgres`
- `vercel link` This step was omitted from the tutorial
- `vercel env pull .env.development.local`
- make sure `.env.development.local` exists locally and that the variables in that file match the ones in the Vercel project
- `npm run dev`
- create file at path: `src/app/api/test/route.ts` 
- visit `http://localhost:3000/api/test` which creates a table in the db which can be seen in the Vercel dashboard
- create file at path: `src/app/api/addPet/route.ts`
- visit `http://localhost:3000/api/addPet?petName=Johnny&ownerName=Mark` which adds a row to the table that was just created

## nostr

```
npm install @nostr-dev-kit/ndk
npm install @noble/hashes
npm install nostr-tools
npm install nostr-hooks
```

- did not do `npm install @nostr-dev-kit/ndk-cache-dexie`
- did not do `npm install nostr-hooks@2.8.4` but instead did latest nostr-hooks

## CRON

to place in vercel.json:

```
    "crons": [
        {
            "path": "/api/nostr/updateFollowsAndMutesNextUserBlock?n=500",
            "schedule": "0,10,20,30,40,50 * * * *"
        },
        {
            "path": "/api/nostr/inputFollowsIntoDbNextUserBlock?n=50",
            "schedule": "5,15,25,35,45,55 * * * *"
        }
    ],
```

## json-schema

ajv for schema validation

`npm install ajv`

follow this guide: https://ajv.js.org/guide/typescript.html

## Getting Started

First, run the development server:

```bash
vercel dev
# or
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
