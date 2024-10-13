import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";

/*
usage:
http://localhost:3000/api/z_oldDb_nostr/query/dbStats
https://interpretation-brainstorm.vercel.app/api/z_oldDb_nostr/query/dbStats
*/

type ResponseData = {
  message: string,
  rows?: object
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const client = await db.connect()
  const response: ResponseData = {
    message: '',
    rows: {
      number: 0,
      withFollows: 0,
      withoutFollows: 0,
      queriedFollowsAndMutes: 0,
      neverQueriedFollowsAndMutes: 0,
      haveFollowsBeenInput: 0
    }
  }
  try {
    const res1 = await client.sql`SELECT id FROM users`;
    console.log('====== res1: ' + res1.rowCount)

    const res4 = await client.sql`SELECT id FROM users WHERE whenlastqueriedfollowsandmutes > 0`;
    console.log('====== res4: ' + res4.rowCount)
    const res5 = await client.sql`SELECT id, follows FROM users WHERE whenlastqueriedfollowsandmutes = 0`;
    console.log('====== res5: ' + res5.rowCount)
    const res6 = await client.sql`SELECT id, haveFollowsAndMutesBeenInput FROM users WHERE haveFollowsAndMutesBeenInput = true`;
    console.log('====== res6: ' + res6.rowCount)

    const res3 = await client.sql`SELECT id, follows FROM users WHERE JSONB_ARRAY_LENGTH(follows) = 0`;
    console.log('====== res3: ' + res3.rowCount)

    const res2 = await client.sql`SELECT id, follows FROM users WHERE JSONB_ARRAY_LENGTH(follows) != 0`;
    console.log('====== res2: ' + res2.rowCount)


    response.rows = {
      number: res1.rowCount,
      withFollows: res2.rowCount,
      withoutFollows: res3.rowCount,
      queriedFollowsAndMutes: res4.rowCount,
      neverQueriedFollowsAndMutes:res5.rowCount,
      haveFollowsBeenInput:res6.rowCount
    }
    response.message = 'Results of your dbStats query:'
    res.status(200).json(response)
  } catch (e) {
    console.log(e)
  } finally {
    client.release()
  }
} 