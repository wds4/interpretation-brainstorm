import NDK, { NDKEvent } from '@nostr-dev-kit/ndk'
import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";
// import 'websocket-polyfill'

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
  const aFollows = event.tags
  const sFollows = JSON.stringify(aFollows)
  return sFollows
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const client = await db.connect();
  try {
    await ndk.connect()
    
    const pubkey1 = 'e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f'
    const filter = { kinds: [3], authors: [pubkey1], limit: 10 }
  
    const sub1 = ndk.subscribe(filter)
    sub1.on('event', async (event) => {
      console.log('event id: ' + event.id)
      console.log('event author: ' + event.pubkey)
      const sFollows:string = returnFollows(event)
      const result = await client.sql`INSERT INTO users (pubkey, follows, followsCreatedAt) VALUES (${event.pubkey}, ${sFollows}, ${event.created_at}) ON CONFLICT DO NOTHING;`;
      console.log(result)
    })
    sub1.on('eose', async () => {
      res.status(200).json({ message: 'nostr: All done!' })
    })
  } catch (error) {
    console.log(error)
  } finally {
    client.release();
  }
}