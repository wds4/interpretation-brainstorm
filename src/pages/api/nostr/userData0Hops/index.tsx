import NDK, { NDKEvent, NDKFilter } from '@nostr-dev-kit/ndk'
import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";
import 'websocket-polyfill'

/*
usage:
http://localhost:3000/api/nostr/userData0Hops?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f

This endpoint searches for follows and mutes from the provided pubkey
and enters them into the intepretation engine database. 
The pubkey's row in the database is the only row that is added or updated.

TODO: option to support npub in addition to pubkey
*/

const explicitRelayUrls = [
  'wss://purplepag.es',
  'wss://profiles.nostr1.com',
  'wss://relay.damus.io'
]
const ndk = new NDK({explicitRelayUrls})

type ResponseData = {
  message: string
}

const returnFollows = (event: NDKEvent) => {
  const aTags = event.tags
  const aFollows:string[] = []
  for (let x=0; x< aTags.length; x++) {
    const aTag = aTags[x]
    if (aTag[0] == 'p') {
      const pk = aTag[1]
      if (!aFollows.includes(pk)) {
        // TODO: check that pk is a valid pubkey
        aFollows.push(pk)
      }
    }
  }
  const sFollows = JSON.stringify(aFollows)
  return sFollows
}

const returnMutes = (event: NDKEvent) => {
  const aTags = event.tags
  const aFollows:string[] = []
  for (let x=0; x< aTags.length; x++) {
    const aTag = aTags[x]
    if (aTag[0] == 'p') {
      const pk = aTag[1]
      if (!aFollows.includes(pk)) {
        // TODO: check that pk is a valid pubkey
        aFollows.push(pk)
      }
    }
  }
  const sFollows = JSON.stringify(aFollows)
  return sFollows
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const searchParams = req.query
  if (searchParams.npub) {
    // TODO: support npub
  }
  if (!searchParams.pubkey) {
    res.status(200).json({ message: 'userData0Hops: pubkey not provided' })
  }
  if (searchParams.pubkey) {
    // const pubkey1 = 'e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f'
    const pubkey1 = searchParams.pubkey
    // TODO: check that pubkey1 is a valid pubkey 
    if (typeof pubkey1 == 'string') {
      const client = await db.connect();
      try {
        await ndk.connect()
        const filter:NDKFilter = { kinds: [3], authors: [pubkey1], limit: 10 }
        const sub1 = ndk.subscribe(filter)
        sub1.on('event', async (event) => {
          // console.log('!!event id: ' + event.id)
          // console.log('!!event author: ' + event.pubkey)
          if (event.kind == 3) {
            const sFollows:string = returnFollows(event)
            const result = await client.sql`INSERT INTO users (pubkey, follows, followsCreatedAt) VALUES (${event.pubkey}, ${sFollows}, ${event.created_at}) ON CONFLICT DO NOTHING;`;
            console.log('sql result:')
            console.log(result)
          }
          if (event.kind == 10000) {
            const sMutes:string = returnMutes(event)
            const result = await client.sql`INSERT INTO users (pubkey, mutes, mutesCreatedAt) VALUES (${event.pubkey}, ${sMutes}, ${event.created_at}) ON CONFLICT DO NOTHING;`;
            console.log('sql result:')
            console.log(result)
          }
        })
        sub1.on('eose', async () => {
          res.status(200).json({ message: 'userData0Hops: All done!!!' })
        })
      } catch (error) {
        console.log(error)
      } finally {
        console.log('releasing the client now')
        client.release();
      }
    }
  }
}