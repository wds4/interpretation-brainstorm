import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";

/*
usage:
http://localhost:3000/api/manageData/blockOfUsers/insertFollowsAndMutesIntoUsersTable?n=10

https://interpretation-brainstorm.vercel.app/api/manageData/blockOfUsers/insertFollowsAndMutesIntoUsersTable?pubkey=n=10

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
  const currentTimestamp = Math.floor(Date.now() / 1000)
  try {
    const res1 = await client.sql`SELECT * FROM users WHERE havefollowsandmutesbeeninput=false ORDER BY whenlastinputfollowsandmutesattempt ASC LIMIT ${numUsers};`;
    if (res1.rowCount) {
        for (let u=0; u < res1.rowCount; u++) {
            const parentPubkey = res1.rows[u].pubkey
            const aFollows = res1.rows[u].follows;
            for (let x=0; x < aFollows.length; x++) {
                const pk = aFollows[x];
                await client.sql`INSERT INTO users (pubkey, lastUpdated) VALUES (${pk}, ${currentTimestamp}) ON CONFLICT DO NOTHING;`;
            }
            const aMutes = res1.rows[u].mutes;
            for (let x=0; x < aMutes.length; x++) {
                const pk = aMutes[x];
                await client.sql`INSERT INTO users (pubkey, lastUpdated) VALUES (${pk}, ${currentTimestamp}) ON CONFLICT DO NOTHING;`;
            }
            await client.sql`UPDATE users SET havefollowsandmutesbeeninput = true, whenlastinputfollowsandmutesattempt = ${currentTimestamp} WHERE pubkey = ${parentPubkey}`;
        }
        const endTimestamp = Date.now()
        const duration = endTimestamp - startTimestamp + ' msec'
        const response:ResponseData = {
          success: true,
          message: 'api/manageData/blockOfUsers/insertFollowsAndMutesIntoUsersTable results:',
          data: {
            numParentPubkeysProcessed: res1.rowCount,
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