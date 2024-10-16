import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";
import { arrayToObject } from '@/helpers';

/*
usage:
http://localhost:3000/api/query/usersPubkeysById
https://interpretation-brainstorm.vercel.app/api/query/usersPubkeysById

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
  const client = await db.connect()
  console.log('============ connecting the db client now')
  try {
    const resultUsers = await client.sql`SELECT id, pubkey FROM users`;

    const observerObjectDataById = arrayToObject(resultUsers.rows, 'id')

    const resultUsersChars = JSON.stringify(resultUsers).length
    const megabyteSize = resultUsersChars / 1048576

    const response: ResponseData = {
      success: true,
      message: 'Results of your usersPubkeyById query:',
      data: {
        megabyteSize,
        observerObjectDataById
      }
    }
    res.status(200).json(response)
  } catch (e) {
    console.log(e)
  } finally {
    console.log('============ releasing the db client')
    client.release()
  }
}
