import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";

/*
This endpoint selects the follows from a block of pubkeys and makes sure each pk in the follows list is entered 
as a row in the local db.
usage: 
http://localhost:3000/api/nostr/inputFollowsIntoDbNextUserBlock?n=10
https://interpretation-brainstorm.vercel.app/api/nostr/inputFollowsIntoDbNextUserBlock?n=100

n indicates the max size of the block
To generate the block, select where numFollows is greater than zero, haveFollowsBeenInput is false and order by whenLastInputFollowsAttempt
Once input, set haveFollowsBeenInput to true

The slowest part of this is checking that the pk is valid 
*/
 
type ResponseData = {
  message: string
}
 
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const searchParams = req.query
  let numUsers = 10 // the default number of users to update
  if (searchParams.n) {
    numUsers = Number(searchParams.n)
    console.log(numUsers)
  }
  // const currentTimestamp = Math.floor(Date.now() / 1000)
  const client = await db.connect();
  try {
    // make a list of pukeys that don't need to be re-added
    const res0 = await client.sql`SELECT * FROM users`;
    const aPubkeys = []
    if (res0.rowCount) {
      for (let x=0; x< res0.rowCount; x++) {
        const pk = res0.rows[x].pubkey
        aPubkeys.push(pk)
      }
    }
    // select the block of users
    const res1 = await client.sql`SELECT * FROM users WHERE (JSONB_ARRAY_LENGTH(follows) != 0) AND (haveFollowsBeenInput = false) ORDER BY whenLastInputFollowsAttempt ASC LIMIT ${numUsers}`;
    console.log('inputFollowsIntoDbNextUserBlock, number of eligible users: ' + res1.rowCount)
    if (res1.rowCount) {
      for (let x=0; x < res1.rowCount; x++) {
        const pk1 = res1.rows[x].pubkey
        console.log('process next pk1: ' + pk1)
        const res2 = await client.sql`SELECT * FROM users WHERE pubkey=${pk1}`;
        const aFollows = res2.rows[0].follows
        const currentTimestamp = Math.floor(Date.now() / 1000)
        for (let y=0; y< aFollows.length; y++) {
          const pk2 = aFollows[y]
          if (!aPubkeys.includes(pk2)) {
            await client.sql`INSERT INTO users (pubkey, lastUpdated) VALUES (${pk2}, ${currentTimestamp}) ON CONFLICT DO NOTHING;`;
            console.log('inserted pubkey: ' +pk2)       
          } else {
            // console.log('ipubkey: ' +pk2 + ' ALREADY PRESENT, no need to re-insert') 
          }
        }
        await client.sql`UPDATE users SET havefollowsbeeninput = true, whenlastinputfollowsattempt = ${currentTimestamp} WHERE pubkey = ${pk1}`;
      }
    }
    client.release();
    res.status(200).json({ message: 'inputFollowsIntoDbNextUserBlock endpoint, client released' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'inputFollowsIntoDbNextUserBlock endpoint with error' })
  } finally {
    // console.log('releasing the db client now')
    // client.release();
    // res.status(200).json({ message: 'inputFollowsIntoDbNextUserBlock endpoint, client released' })
  }
  // res.status(200).json({ message: 'you have reached the inputFollowsIntoDbNextUserBlock endpoint' })
}