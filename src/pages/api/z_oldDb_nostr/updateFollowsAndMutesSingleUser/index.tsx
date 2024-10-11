import NDK, { NDKEvent, NDKFilter } from '@nostr-dev-kit/ndk'
import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";
import { verifyPubkeyValidity } from '@/helpers/nip19';
// import 'websocket-polyfill'

/*
usage:
http://localhost:3000/api/nostr/updateFollowsAndMutesSingleUser?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f
https://interpretation-brainstorm.vercel.app/api/nostr/updateFollowsAndMutesSingleUser?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f

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
        if (verifyPubkeyValidity(pk)) {
          aFollows.push(pk)
        }
      }
    }
  }
  const sFollows = JSON.stringify(aFollows)
  return sFollows
}

const returnMutes = (event: NDKEvent) => {
  const aTags = event.tags
  const aMutes:string[] = []
  for (let x=0; x< aTags.length; x++) {
    const aTag = aTags[x]
    if (aTag[0] == 'p') {
      const pk = aTag[1]
      if (!aMutes.includes(pk)) {
        if (verifyPubkeyValidity(pk)) {
          aMutes.push(pk)
        }
      }
    }
  }
  const sMutes = JSON.stringify(aMutes)
  return sMutes
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
    res.status(200).json({ message: 'updateFollowsAndMutesSingleUser: pubkey not provided' })
  }
  if (searchParams.pubkey) {
    // const pubkey1 = 'e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f'
    const pubkey1 = searchParams.pubkey
    if ((typeof pubkey1 == 'string') && (verifyPubkeyValidity(pubkey1)) ) {
      const client = await db.connect();
      const result_exists = await client.sql`SELECT EXISTS(SELECT 1 FROM users WHERE pubkey=${pubkey1}) AS "exists"`
      console.log(result_exists)
      if (result_exists.rows[0].exists == true) {
        // do nothing
        console.log('pubkey already exists in database')
      }
      if (result_exists.rows[0].exists == false) {
        console.log('pubkey does not exist in database; adding it now')
        const currentTimestamp = Math.floor(Date.now() / 1000)
        const result_insert = await client.sql`INSERT INTO users (pubkey, lastUpdated) VALUES (${pubkey1}, ${currentTimestamp}) ON CONFLICT DO NOTHING;`;
        console.log('sql result:' + result_insert)
      }
      try {
        await ndk.connect()
        const filter:NDKFilter = { kinds: [3, 10000], authors: [pubkey1], limit: 10 }
        const sub1 = ndk.subscribe(filter)
        sub1.on('event', async (event) => {
          if (event.kind == 3) {
            // TODO: if previously stored, verify that event.created_at is more recent than what is in current storage
            const sFollows:string = returnFollows(event)
            const result_update_follows = await client.sql`UPDATE users SET follows=${sFollows}, followsCreatedAt=${event.created_at} WHERE pubkey=${event.pubkey}`;
            /*
            // This takes too long and does not always complete, so moved it to its own endpoint
            const aFollows = JSON.parse(sFollows)
            for (let x=0; x< aFollows.length; x++) {
              const pk = aFollows[x]
              const result_insert = await client.sql`INSERT INTO users (pubkey) VALUES (${pk}) ON CONFLICT DO NOTHING;`;
              // console.log('inserted pubkey: ' +pk)
              // console.log(result_insert)
            }
            */
            console.log('sql result_update_follows:')
            console.log(result_update_follows)
          }
          if (event.kind == 10000) {
            // TODO: if previously stored, verify that event.created_at is more recent than what is in current storage
            const sMutes:string = returnMutes(event)
            const result_update_mutes = await client.sql`UPDATE users SET mutes=${sMutes}, mutesCreatedAt=${event.created_at} WHERE pubkey=${event.pubkey}`;
            console.log('sql result_update_mutes:')
            console.log(result_update_mutes)
          }
        })
        sub1.on('eose', async () => {
          res.status(200).json({ message: 'updateFollowsAndMutesSingleUser: ndk eose received; All done!!!' })
        })
      } catch (error) {
        console.log(error)
      } finally {
        console.log('releasing the db client now')
        client.release();
      }
    }
  }
}