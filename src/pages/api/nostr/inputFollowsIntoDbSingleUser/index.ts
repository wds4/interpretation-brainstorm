import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";
import { verifyPubkeyValidity } from '@/helpers/nip19';

/*
This endpoint selects the follows from the indicated pubkey and makes sure each pk in the follows list is entered 
as a row in the local db.
usage: 
http://localhost:3000/api/nostr/inputFollowsIntoDbSingleUser?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f

*/
type ResponseData = {
  message: string,
  userData?: object
}
 
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const response: ResponseData = {
    message: '',
    userData: {
      numRows: 0,
      numFollows: 0,
      numMutes: 0
    }
  }
  const searchParams = req.query
  if (searchParams.npub) {
    // TODO: support npub
  }
  if (!searchParams.pubkey) {
    res.status(200).json({ message: 'inputFollowsIntoDbSingleUser: pubkey not provided' })
  }
  if (searchParams.pubkey) {
    const pubkey1 = searchParams.pubkey
    if ((typeof pubkey1 == 'string') && (verifyPubkeyValidity(pubkey1)) ) {
      const client = await db.connect()
      try {
        const res1 = await client.sql`SELECT * FROM users WHERE pubkey=${pubkey1}`;
        console.log(res1)
        const aFollows = res1.rows[0].follows
        const currentTimestamp = Math.floor(Date.now() / 1000)
        for (let x=0; x< aFollows.length; x++) {
          const pk = aFollows[x]
          await client.sql`INSERT INTO users (pubkey, lastUpdated) VALUES (${pk}, ${currentTimestamp}) ON CONFLICT DO NOTHING;`;
          // console.log('inserted pubkey: ' +pk)
        }
        await client.sql`UPDATE users SET havefollowsbeeninput = true, whenlastinputfollowsattempt = ${currentTimestamp} WHERE pubkey = ${pubkey1}`;
        const aMutes = res1.rows[0].mutes
        response.message = 'Results of your singleUser query:'
        response.userData = {
          pubkey: res1.rows[0].pubkey,
          numRows: res1.rowCount,
          numFollows: aFollows.length,
          numMutes: aMutes.length
        }
        res.status(200).json(response)
      } catch (e) {
        console.log(e)
        response.message = 'error'
        res.status(500).json(response)
      } finally {
        client.release()
      }
    }
  }
  response.message = 'You have reached the nostr: query: singleUser API endpoint. Hooray!'
  res.status(200).json(response)
} 