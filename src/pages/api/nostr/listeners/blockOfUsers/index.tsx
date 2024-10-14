import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";
import { verifyPubkeyValidity } from '@/helpers/nip19';
import NDK, { NDKEvent, NDKFilter } from '@nostr-dev-kit/ndk';

/*
This endpoint queries nostr for kinds 3 and 10000 events from a block of users
usage: 
http://localhost:3000/api/nostr/listeners/blockOfUsers?n=10
https://interpretation-brainstorm.vercel.app/api/nostr/listeners/blockOfUsers?n=5

n indicates the max size of the block
To generate the block, select users, order by whenLastQueriedFollowsAndMutes
When kind 3 is found, set haveFollowsBeenInput to false
Update whenLastQueriedFollowsAndMutes whether success or failure

The slowest part of this is checking that the pk is valid (?)
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
  let numUsers = 10 // the default number of users to update
  if (searchParams.n) {
    numUsers = Number(searchParams.n)
  }
  const currentTimestamp = Math.floor(Date.now() / 1000)
  const client = await db.connect();
  try {
    // select the block of users
    const res1 = await client.sql`SELECT * FROM users ORDER BY whenLastQueriedFollowsAndMutes ASC LIMIT ${numUsers}`;
    // console.log('inputFollowsIntoDbNextUserBlock, number of eligible users: ' + res1.rowCount)
    if (res1.rowCount) {
      const authors = []
      const followsCreatedAtLookup:{[key:string]: number} = {}
      const mutesCreatedAtLookup:{[key:string]: number} = {}
      for (let x=0; x < res1.rowCount; x++) {
        const pk = res1.rows[x].pubkey
        const followsCreatedAt = res1.rows[x].followscreatedat
        const mutesCreatedAt = res1.rows[x].mutescreatedat
        followsCreatedAtLookup[pk] = followsCreatedAt
        mutesCreatedAtLookup[pk] = mutesCreatedAt

        // console.log('process next pk: ' + pk)
        authors.push(pk)
        await client.sql`UPDATE users SET havefollowsandmutesbeeninput = false, whenLastQueriedFollowsAndMutes=${currentTimestamp} WHERE pubkey=${pk}`;
        // console.log(foo)
      }  
      await ndk.connect()
      const filter:NDKFilter = { kinds: [3, 10000], authors }
      const sub1 = ndk.subscribe(filter)
      let numFollowUpdates = 0
      let numMuteUpdates = 0
      sub1.on('event', async (event) => {
        if (event.kind == 3) {  
          if (event.created_at && (event.created_at > followsCreatedAtLookup[event.pubkey])) {
            numFollowUpdates++
            const aFollows:string[] = returnFollows(event)
            const sFollows = JSON.stringify(aFollows)
            console.log(`================= pubkey: ${event.pubkey} has ${aFollows.length} follows`)
            await client.sql`UPDATE users SET follows=${sFollows}, followsCreatedAt=${event.created_at} WHERE pubkey=${event.pubkey}`;
          }
        }
        if (event.kind == 10000) {
          if (event.created_at && (event.created_at > mutesCreatedAtLookup[event.pubkey])) {
            numMuteUpdates++
            const aMutes:string[] = returnMutes(event)
            const sMutes = JSON.stringify(aMutes)
            await client.sql`UPDATE users SET mutes=${sMutes}, mutesCreatedAt=${event.created_at} WHERE pubkey=${event.pubkey}`;
          }
        }
      })
      sub1.on('eose', async () => {
        console.log('EOSE RECEIVED, db client being released!!!!!!!!!!!!!!!!!!')
        client.release();
        const response:ResponseData = {
          success: true,
          message: `updateFollowsAndMutesNextUserBlock: ndk eose received; All done!`,
          data: {
            numFollowUpdates,
            numMuteUpdates
          }
        }
        res.status(200).json(response)
      })
    }
  } catch (error) {
    console.log(error)
    const response:ResponseData = {
      success: false,
      message: `updateFollowsAndMutesNextUserBlock: endpoint with error`,
      data: { error }
    }
    res.status(500).json(response)
  } finally {
    console.log('releasing the db client now')
    // client.release();
    // res.status(200).json({ message: 'updateFollowsAndMutesNextUserBlock endpoint, client released' })
  }
}