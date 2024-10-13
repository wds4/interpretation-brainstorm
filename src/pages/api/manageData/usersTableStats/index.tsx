import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres"
import { verifyPubkeyValidity } from '@/helpers/nip19';

/*
usage:
http://localhost:3000/api/manageData/usersTableStats
https://interpretation-brainstorm.vercel.app/api/manageData/usersTableStats
*/

type ResponseData = {
  success: boolean
  message: string
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
      message: 'api/manageData/usersTableStats: pubkey not provided',
    }
    res.status(500).json(response)
  }
  if (searchParams.pubkey) {
    const pubkey1 = searchParams.pubkey
    if ((typeof pubkey1 == 'string') && (verifyPubkeyValidity(pubkey1)) ) {
      const client = await db.connect()
      console.log('============ connecting the db client now')
      try {
        const count = await client.sql`SELECT count(*) FROM users`;
        const myData = await client.sql`SELECT * FROM users WHERE pubkey=${pubkey1}`
        const response:ResponseData = {
          success: true,
          message: `data from table: users`,
          data: {
            numPubkeys: count.rows[0].count,
            sqlResponseObject1: myData,
            sqlResponseObject2: count
          }
        }
        res.status(200).json(response)
      } catch (error) {
        console.log(error)
        const response:ResponseData = {
          success: false,
          message: `error: ${error}`
        }
        res.status(500).json(response)
      } finally {
        console.log('============ releasing the db client now')
        client.release();
      }
    } else {
      const response:ResponseData = {
        success: false,
        message: 'api/manageData/usersTableStats: the provided pubkey is invalid',
      }
      res.status(500).json(response)
    }
  }
}