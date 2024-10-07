import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";
import { verifyPubkeyValidity } from '@/helpers/nip19';

/*
usage: 
http://localhost:3000/api/nostr/query/singleUser?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f

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
    res.status(200).json({ message: 'nostr/query/singleUser: pubkey not provided' })
  }
  if (searchParams.pubkey) {
    const pubkey1 = searchParams.pubkey
    if ((typeof pubkey1 == 'string') && (verifyPubkeyValidity(pubkey1)) ) {
      const client = await db.connect()
      try {
        const res1 = await client.sql`SELECT * FROM users WHERE pubkey=${pubkey1}`;
        console.log(res1)
        const aFollows = res1.rows[0].follows
        const aMutes = res1.rows[0].mutes
        response.message = 'Results of your nostr/query/singleUser query:'
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
  response.message = 'You have reached the nostr/query/singleUser API endpoint. Hooray!'
  res.status(200).json(response)
} 