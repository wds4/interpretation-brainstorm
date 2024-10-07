import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";

/*
This endpoint selects the follows from a block of pubkeys and makes sure each pk in the follows list is entered 
as a row in the local db.
usage: 
http://localhost:3000/api/nostr/inputFollowsIntoDbNextUserBlock?n=10

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
    // select the block of users
    const res1 = await client.sql`SELECT * FROM users WHERE (JSONB_ARRAY_LENGTH(follows) != 0) AND (haveFollowsBeenInput = false) ORDER BY whenLastInputFollowsAttempt ASC `;
    console.log('inputFollowsIntoDbNextUserBlock, number of eligible users: ' + res1.rowCount)
    // TODO: cycle through block
  } catch (error) {
    console.log(error)
  } finally {
    console.log('releasing the db client now')
    client.release();
  }
  res.status(200).json({ message: 'you have reached the inputFollowsIntoDbNextUserBlock endpoint' })
}