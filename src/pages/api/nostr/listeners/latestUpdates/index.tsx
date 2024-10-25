import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";
import { verifyPubkeyValidity } from '@/helpers/nip19';
import NDK, { NDKEvent, NDKFilter } from '@nostr-dev-kit/ndk';

/*
This endpoint queries nostr for kinds 3 and 10000 events since now minus t seconds ago 

http://localhost:3000/api/nostr/listeners/latestUpdates?t=3600
https://interpretation-brainstorm.vercel.app/api/nostr/listeners/latestUpdates?n=3600

t indicates the number of seconds old

Currently saves results for all pubkeys; in future maybe purge or omit pubkeys not in network??
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
  let numSeconds = 3600 // the default number of seconds
  if (searchParams.t) {
    numSeconds = Number(searchParams.t)
  }
  const currentTimestamp = Math.floor(Date.now() / 1000)
  const sinceTimestamp = currentTimestamp - numSeconds
  const startTimestamp = Date.now()
  const client = await db.connect();
  try {
    await ndk.connect()
    const filter:NDKFilter = { kinds: [3, 10000], since: sinceTimestamp, limit: 10 }
    const sub1 = ndk.subscribe(filter)
    let numFollowUpdates = 0
    let numMuteUpdates = 0
    sub1.on('event', async (event) => {
      if (event.kind == 3) {  
        numFollowUpdates++
        const aFollows:string[] = returnFollows(event)
        console.log(`================= pubkey: ${event.pubkey} has ${aFollows.length} follows`)
        const sFollows = JSON.stringify(aFollows)
        await client.sql`INSERT INTO users (pubkey, lastUpdated) VALUES (${event.pubkey}, ${currentTimestamp}) ON CONFLICT DO NOTHING;`;
        await client.sql`UPDATE users SET havefollowsandmutesbeeninput = false, follows=${sFollows}, followsCreatedAt=${event.created_at} WHERE pubkey=${event.pubkey}`;
      }
      if (event.kind == 10000) {
        numMuteUpdates++
        const aMutes:string[] = returnMutes(event)
        console.log(`================= pubkey: ${event.pubkey} has ${aMutes.length} mutes`)
        const sMutes = JSON.stringify(aMutes)
        await client.sql`INSERT INTO users (pubkey, lastUpdated) VALUES (${event.pubkey}, ${currentTimestamp}) ON CONFLICT DO NOTHING;`;
        await client.sql`UPDATE users SET havefollowsandmutesbeeninput = false, mutes=${sMutes}, mutesCreatedAt=${event.created_at} WHERE pubkey=${event.pubkey}`;
      }
    })
    sub1.on('eose', async () => {
      console.log('EOSE RECEIVED.')
      const endTimestamp = Date.now()
      const duration = endTimestamp - startTimestamp + ' msec'
      const response:ResponseData = {
        success: true,
        message: `latestUpdates: ndk eose received; All done!`,
        data: {
          numFollowUpdates,
          numMuteUpdates,
          duration
        }
      }
      res.status(200).json(response)
    })
  } catch (error) {
    console.log(error)
    const response:ResponseData = {
      success: false,
      message: `latestUpdates: endpoint with error`,
      data: { error }
    }
    res.status(500).json(response)
  } finally {
    // console.log('************** releasing the db client now ****************')
    // client.release();
  }
}