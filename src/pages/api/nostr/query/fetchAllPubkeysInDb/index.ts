import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";

/*
usage:
http://localhost:3000/api/nostr/query/fetchAllPubkeysInDb
https://interpretation-brainstorm.vercel.app/api/nostr/query/fetchAllPubkeysInDb
*/

type ResponseData = {
  message: string,
  data?: object
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const client = await db.connect()
  const response: ResponseData = {
    message: '',
    data: {
      totalNumberOfPubkeys: 0,
      aPubkeys: []
    }
  }
  try {
    const res1 = await client.sql`SELECT * FROM users`;
    console.log(res1)
    response.data = {
      totalNumberOfPubkeys: res1.rowCount
    }
    response.message = 'Results of your fetchAllPubkeysInDb query:'
    res.status(200).json(response)
  } catch (e) {
    const response: ResponseData = {
      message: 'fetchAllPubkeysInDb error',
      data: {
        error: e
      }
    }
    res.status(500).json(response)
  } finally {
    client.release()
  }
  // response.message = 'You have reached the nostr: query: fetchAllPubkeysInDb API endpoint. Hooray!'
  // res.status(200).json(response)
} 