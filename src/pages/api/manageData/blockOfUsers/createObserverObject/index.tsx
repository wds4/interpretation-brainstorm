import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";

/*
usage:
http://localhost:3000/api/manageData/blockOfUsers/createObserverObject?n=10

https://interpretation-brainstorm.vercel.app/api/manageData/blockOfUsers/createObserverObject?pubkey=n=10

This endpoint searches for follows and mutes from a block of pubkeys
and enters them into the intepretation engine database. 
The newly added rows in the database are the only rows that are updated.
*/


type ResponseData = {
  success: boolean,
  message: string,
  data?: object
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
  const startTimestamp = Date.now()
  const client = await db.connect();
  // const currentTimestamp = Math.floor(Date.now() / 1000)
  try {
      // TODO -- all of it




    const res1 = await client.sql`SELECT * FROM users WHERE ... ORDER BY ... ASC LIMIT ${numUsers};`;
    if (res1.rowCount) {
        for (let u=0; u < res1.rowCount; u++) {
            // const parentPubkey = res1.rows[u].pubkey
            // TODO - all of it

        }
        const endTimestamp = Date.now()
        const duration = endTimestamp - startTimestamp + ' msec'
        const response:ResponseData = {
          success: true,
          message: 'api/manageData/blockOfUsers/createObserverObject results:',
          data: {
            duration: duration
          }
        }
        res.status(200).json(response)
    }
  } catch (error) {
    console.log(error)
    const response:ResponseData = {
      success: false,
      message: 'error: ' + error
    }
    res.status(500).json(response)
  } finally {
    console.log('releasing the db client now')
    client.release();
  }
}