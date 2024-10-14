import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";
import { verifyPubkeyValidity } from '@/helpers/nip19';

/*
usage:
http://localhost:3000/api/query/multiTableStats?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f
https://interpretation-brainstorm.vercel.app/api/query/multiTableStats?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f
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
  if (searchParams.npub) {
    // TODO: support npub
  }
  if (!searchParams.pubkey) {
    const response:ResponseData = {
      success: false,
      message: 'api/query/multiTableStats: pubkey not provided',
    }
    res.status(500).json(response)
  }
  if (searchParams.pubkey) {
    const pubkey1 = searchParams.pubkey
    if ((typeof pubkey1 == 'string') && (verifyPubkeyValidity(pubkey1)) ) {
      const client = await db.connect()
      console.log('============ connecting the db client now')
      try {
        const resultMeUsers = await client.sql`SELECT * FROM users WHERE pubkey=${pubkey1}`;
        const resultMeCustomers = await client.sql`SELECT * FROM customers WHERE pubkey=${pubkey1}`;
        const resultMeDosSummaries = await client.sql`SELECT * FROM dosSummaries WHERE pubkey=${pubkey1}`;
        const resUsersTableSize = await client.sql`SELECT pg_size_pretty( pg_total_relation_size('users') );`;
        const res1 = await client.sql`SELECT id FROM users`;
        const res2 = await client.sql`SELECT id, follows FROM users WHERE JSONB_ARRAY_LENGTH(follows) != 0`;
        const res2b = await client.sql`SELECT id, follows FROM users WHERE haveFollowsAndMutesBeenInput = false AND (JSONB_ARRAY_LENGTH(follows) > 0 OR JSONB_ARRAY_LENGTH(mutes) > 0)`;
        const res3 = await client.sql`SELECT id, follows FROM users WHERE JSONB_ARRAY_LENGTH(follows) = 0`;
        const res4 = await client.sql`SELECT id FROM users WHERE whenlastqueriedfollowsandmutes > 0`;
        const res5 = await client.sql`SELECT id, follows FROM users WHERE whenlastqueriedfollowsandmutes = 0`;
        const res6 = await client.sql`SELECT id FROM users WHERE haveFollowsAndMutesBeenInput = true`;
        const res6b = await client.sql`SELECT id FROM users WHERE (followsCreatedAt > 0 OR mutesCreatedAt > 0) AND whenlastqueriedfollowsandmutes > 0 AND haveFollowsAndMutesBeenInput = false`;
        const res7 = await client.sql`SELECT id FROM users WHERE followsCreatedAt > 0`;
        const res8 = await client.sql`SELECT id FROM users WHERE mutesCreatedAt > 0`;
        const res9 = await client.sql`SELECT id FROM users WHERE haveFollowsAndMutesBeenInput = true AND whenlastcreatedobserverobject = 0`;
        const res10 = await client.sql`SELECT id FROM users WHERE whenlastcreatedobserverobject > 0`;

        console.log('====== res1Me: ' + resultMeUsers.rowCount)
        console.log('====== res1: ' + res1.rowCount)
        console.log('====== res2: ' + res2.rowCount)
        console.log('====== res2b: ' + res2b.rowCount)
        console.log('====== res3: ' + res3.rowCount)
        console.log('====== res4: ' + res4.rowCount)
        console.log('====== res5: ' + res5.rowCount)
        console.log('====== res6: ' + res6.rowCount)
        console.log('====== res6b: ' + res6b.rowCount)
        console.log('====== res7: ' + res7.rowCount)
        console.log('====== res8: ' + res8.rowCount)
    
        const response: ResponseData = {
          success: true,
          message: 'Results of your multiTables query:',
          data: {
            users: {
              numberOfPubkeys: res1.rowCount,
              withFollows: res2.rowCount,
              withoutFollows: res3.rowCount,
              queriedFollowsAndMutes: res4.rowCount,
              neverQueriedFollowsAndMutes:res5.rowCount,
              haveFollowsAndMutesBeenInput:res6.rowCount,
              followsCreatedAtNotZero:res7.rowCount,
              mutesCreatedAtNotZero:res8.rowCount,
              usersTableSize: resUsersTableSize.rows[0].pg_size_pretty
            },
            blockTasks: {
              step1_nostrListener: {
                awaiting: res5.rowCount,
                alreadyListened: res4.rowCount,
                url: 'https://interpretation-brainstorm.vercel.app/api/nostr/listeners/blockOfUsers?n=5',
                comments: 'sometimes fast, sometimes slow'
              },
              step2_insertFollowsAndMutesIntoUsersTable: {
                awaiting: res2b.rowCount,
                alreadyDone: res6.rowCount,
                url: 'https://interpretation-brainstorm.vercel.app/api/manageData/blockOfUsers/insertFollowsAndMutesIntoUsersTable?n=10',
                comments: 'super slow; need to batch INSERT commands'
              },
              step3_createObserverObject: {
                awaiting: res9.rowCount,
                alreadyDone: res10.rowCount,
                url: 'https://interpretation-brainstorm.vercel.app/api/manageData/blockOfUsers/createObserverObject?n=500',
                comments: 'super fast'
              }
            },
            mydata: {
              customers: {
                id: resultMeCustomers.rows[0].id,
              },
              dosSummaries: {
                dosData: resultMeDosSummaries.rows[0].dosdata,
              },
              users: {
                pubkey: pubkey1,
                id: resultMeUsers.rows[0].id,
                numFollows: resultMeUsers.rows[0].follows.length,
                numMutes: resultMeUsers.rows[0].mutes.length,
                observerObject: resultMeUsers.rows[0].observerobject
              }
            }
          }
        }
        res.status(200).json(response)
      } catch (e) {
        console.log(e)
      } finally {
        console.log('============ releasing the db client')
        client.release()
      }
    } else {
      const response:ResponseData = {
        success: false,
        message: 'api/query/multiTableStats: invalid pubkey',
      }
      res.status(500).json(response)
    }
  }

} 