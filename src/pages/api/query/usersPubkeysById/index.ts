import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";
import { verifyPubkeyValidity } from '@/helpers/nip19';

/*
usage:
http://localhost:3000/api/query/usersPubkeyById
https://interpretation-brainstorm.vercel.app/api/query/usersPubkeyById

returns an object used to fetch a user pubkey given the userID from the table: users

Useful since several ables, including ratingsTables and scorecardsTables, use userID rather than pubkey to refer to users 
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
      message: 'api/query/usersPubkeyById: pubkey not provided',
    }
    res.status(500).json(response)
  }
  if (searchParams.pubkey) {
    const pubkey1 = searchParams.pubkey
    if ((typeof pubkey1 == 'string') && (verifyPubkeyValidity(pubkey1)) ) {
      const client = await db.connect()
      console.log('============ connecting the db client now')
      try {
        const resultUsers = await client.sql`SELECT id, pubkey FROM users`;
        const resultUsersChars = JSON.stringify(resultUsers).length
        const megabyteSize = resultUsersChars / 1048576
    
        const response: ResponseData = {
          success: true,
          message: 'Results of your usersPubkeyById query:',
          data: {
            megabyteSize
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
        message: 'api/query/usersPubkeyById: invalid pubkey',
      }
      res.status(500).json(response)
    }
  }
} 

        /*

                      [res10.rows[0].pubkey]: JSON.stringify(res10.rows[0].observerobject)


        */