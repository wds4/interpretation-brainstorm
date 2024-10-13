import NDK, { NDKEvent, NDKFilter } from '@nostr-dev-kit/ndk'
import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";
import { verifyPubkeyValidity } from '@/helpers/nip19';
// import 'websocket-polyfill'

/*
usage:
http://localhost:3000/api/nostr/listeners/singleUser?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f

https://interpretation-brainstorm.vercel.app/api/nostr/listeners/singleUser?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f

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
  success: boolean
  message: string
  data?: object
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
  return aFollows
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
  return aMutes
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
    const response:ResponseData = {
      success: false,
      message: `updateFollowsAndMutesSingleUser: pubkey not provided`
    }
    res.status(500).json(response)
  }
  if (searchParams.pubkey) {
    const pubkey1 = searchParams.pubkey
    const currentTimestamp = Math.floor(Date.now() / 1000)
    let numFollows = 0
    let kind3timestamp:number|undefined = 0
    let numMutes = 0
    let kind10000timestamp:number|undefined = 0
    const startTimestamp = Date.now()
    if ((typeof pubkey1 == 'string') && (verifyPubkeyValidity(pubkey1)) ) {
      const client = await db.connect();
      const result_exists = await client.sql`SELECT EXISTS(SELECT 1 FROM users WHERE pubkey=${pubkey1}) AS "exists"`
      console.log(result_exists)
      if (result_exists.rows[0].exists == true) {
        console.log('pubkey already exists in database')
      }
      if (result_exists.rows[0].exists == false) {
        console.log('pubkey does not exist in database; adding it now')
        const result_insert = await client.sql`INSERT INTO users (pubkey, lastUpdated) VALUES (${pubkey1}, ${currentTimestamp}) ON CONFLICT DO NOTHING;`;
        console.log('sql result:' + result_insert)
      }
      try {
        await ndk.connect()
        const filter:NDKFilter = { kinds: [3, 10000], authors: [pubkey1], limit: 10 }
        await client.sql`UPDATE users SET whenLastQueriedFollowsAndMutes=${currentTimestamp} WHERE pubkey=${pubkey1}`;
        const sub1 = ndk.subscribe(filter)
        sub1.on('event', async (event) => {
          if (event.kind == 3) {
            // TODO: if previously stored, verify that event.created_at is more recent than what is in current storage
            const aFollows:string[] = returnFollows(event)
            const sFollows = JSON.stringify(aFollows)
            numFollows = aFollows.length
            kind3timestamp = event.created_at
            const result_update_follows = await client.sql`UPDATE users SET follows=${sFollows}, followsCreatedAt=${event.created_at} WHERE pubkey=${event.pubkey}`;
            console.log('sql result_update_follows:')
            console.log(result_update_follows)
          }
          if (event.kind == 10000) {
            // TODO: if previously stored, verify that event.created_at is more recent than what is in current storage
            const aMutes:string[] = returnMutes(event)
            const sMutes = JSON.stringify(aMutes)
            numMutes = aMutes.length
            kind10000timestamp = event.created_at
            const result_update_mutes = await client.sql`UPDATE users SET mutes=${sMutes}, mutesCreatedAt=${event.created_at} WHERE pubkey=${event.pubkey}`;
            console.log('sql result_update_mutes:')
            console.log(result_update_mutes)
          }
        })
        sub1.on('eose', async () => {
          const endTimestamp = Date.now()
          const duration = endTimestamp - startTimestamp + ' msec'
          const response:ResponseData = {
            success: true,
            message: `updateFollowsAndMutesSingleUser: ndk eose received; All done!!!`,
            data: {
              kind3event: {
                created_at: kind3timestamp,
                numFollows: numFollows
              },
              kind10000event: {
                created_at: kind10000timestamp,
                numMutes: numMutes
              },
              start: startTimestamp,
              end: endTimestamp,
              duration: duration
            }
          }
          res.status(200).json(response)
        })
      } catch (error) {
        console.log(error)
      } finally {
        console.log('releasing the db client now')
        client.release();
      }
    } else {
      const response:ResponseData = {
        success: true,
        message: `updateFollowsAndMutesSingleUser: the provided pubkey is invalid`
      }
      res.status(500).json(response)
    }
  }
}