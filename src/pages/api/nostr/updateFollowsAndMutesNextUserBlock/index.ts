import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";
import { verifyPubkeyValidity } from '@/helpers/nip19';
import NDK, { NDKEvent, NDKFilter } from '@nostr-dev-kit/ndk';

/*
This endpoint queries nostr for kinds 3 and 10000 events from a block of users
usage: 
http://localhost:3000/api/nostr/updateFollowsAndMutesNextUserBlock?n=10

n indicates the max size of the block
To generate the block, select users, order by whenLastQueriedFollowsAndMutes
When kind 3 is found, set haveFollowsBeenInput to false
Update whenLastQueriedFollowsAndMutes whether success or failure

The slowest part of this is checking that the pk is valid 
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
  let numUsers = 10 // the default number of users to update
  if (searchParams.n) {
    numUsers = Number(searchParams.n)
  }
  const currentTimestamp = Math.floor(Date.now() / 1000)
  const client = await db.connect();
  try {
    // select the block of users
    const res1 = await client.sql`SELECT * FROM users ORDER BY whenLastQueriedFollowsAndMutes ASC LIMIT ${numUsers}`;
    console.log('inputFollowsIntoDbNextUserBlock, number of eligible users: ' + res1.rowCount)
    if (res1.rowCount) {
      const authors = []
      for (let x=0; x < res1.rowCount; x++) {
        const pk = res1.rows[x].pubkey
        console.log('process next pk: ' + pk)
        authors.push(pk)
        const foo = await client.sql`UPDATE users SET whenLastQueriedFollowsAndMutes=${currentTimestamp} WHERE pubkey=${pk}`;
        console.log(foo)
      }  
      await ndk.connect()
      const filter:NDKFilter = { kinds: [3, 10000], authors }
      const sub1 = ndk.subscribe(filter)
      sub1.on('event', async (event) => {
        if (event.kind == 3) {
          // TODO: if previously stored, verify that event.created_at is more recent than what is in current storage
          const sFollows:string = returnFollows(event)
          const result_update_follows = await client.sql`UPDATE users SET follows=${sFollows}, followsCreatedAt=${event.created_at} WHERE pubkey=${event.pubkey}`;
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
        res.status(200).json({ message: 'updateFollowsAndMutesNextUserBlock: ndk eose received; All done!!!' })
      })
    }
  } catch (error) {
    console.log(error)
  } finally {
    console.log('releasing the db client now')
    client.release();
  }
  res.status(200).json({ message: 'you have reached the updateFollowsAndMutesNextUserBlock endpoint' })
}