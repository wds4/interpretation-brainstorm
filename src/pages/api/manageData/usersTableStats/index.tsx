import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres"

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
  const client = await db.connect()
  console.log('============ connecting the db client now')
  try {
    const count = await client.sql`SELECT count(*) FROM users`;
    const response:ResponseData = {
      success: true,
      message: `data from table: users`,
      data: {
        numPubkeys: count.rowCount,
        moreData: count
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
}