import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";
import { verifyPubkeyValidity } from '@/helpers/nip19';
// import 'websocket-polyfill'

/*
usage:
http://localhost:3000/api/manageData/singleUser/insertFollowsAndMutesIntoUsersTable?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f

https://interpretation-brainstorm.vercel.app/api/manageData/singleUser/insertFollowsAndMutesIntoUsersTable?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f

This endpoint searches for follows and mutes from the provided pubkey
and enters them into the intepretation engine database. 
The pubkey's row in the database is the only row that is added or updated.

*/


type ResponseData = {
  success: boolean,
  message: string,
  userData?: object
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const searchParams = req.query
  if (searchParams.npub) {
    // TODO: support npub
  }
  if (!searchParams.pubkey) {
    const response:ResponseData = {
      success: false,
      message: 'api/manageData/singleUser/insertFollowsAndMutesIntoUsersTable: pubkey not provided',
    }
    res.status(500).json(response)
  }
  if (searchParams.pubkey) {
    const pubkey1 = searchParams.pubkey
    if ((typeof pubkey1 == 'string') && (verifyPubkeyValidity(pubkey1)) ) {
      const client = await db.connect();
      const currentTimestamp = Math.floor(Date.now() / 1000)
      try {
        const res1 = await client.sql`SELECT * FROM users WHERE pubkey=${pubkey1};`;
        if (res1.rowCount == 1) {
            const aFollows = res1.rows[0].follows;
            for (let x=0; x < aFollows.length; x++) {
                const pk = aFollows[x];
                await client.sql`INSERT INTO users (pubkey, lastUpdated) VALUES (${pk}, ${currentTimestamp}) ON CONFLICT DO NOTHING;`;
            }
            const aMutes = res1.rows[0].mutes;
            for (let x=0; x < aMutes.length; x++) {
                const pk = aMutes[x];
                await client.sql`INSERT INTO users (pubkey, lastUpdated) VALUES (${pk}, ${currentTimestamp}) ON CONFLICT DO NOTHING;`;
            }
            await client.sql`UPDATE users SET havefollowsandmutesbeeninput = true, whenlastinputfollowsandmutesattempt = ${currentTimestamp} WHERE pubkey = ${pubkey1}`;

            if (searchParams.nextStep && searchParams.nextStep == 'true') {
              const url = `https://interpretation-brainstorm.vercel.app/api/manageData/singleUser/createObserverObject?pubkey=${pubkey1}&nextStep=true`
              console.log(`url: ${url}`)
              const triggerNextEndpoint = (url:string) => {
                fetch(url)
              }
              triggerNextEndpoint(url)
            }

            const response:ResponseData = {
              success: true,
              message: 'api/manageData/singleUser/insertFollowsAndMutesIntoUsersTable results:',
              userData: {
                pubkey: res1.rows[0].pubkey,
                numRows: res1.rowCount,
                numFollows: aFollows.length,
                numMutes: aMutes.length
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
    } else {
      const response:ResponseData = {
        success: false,
        message: 'api/manageData/singleUser/insertFollowsAndMutesIntoUsersTable: the provided pubkey is invalid',
      }
      res.status(500).json(response)
    }
  }
}