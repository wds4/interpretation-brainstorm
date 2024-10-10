import type { NextApiRequest, NextApiResponse } from 'next'
import { sql } from "@vercel/postgres";

/*
to access:
http://localhost:3000/api/tests/selectCat?name=felix
https://interpretation-brainstorm.vercel.app/api/tests/selectCat?name=felix
*/

type ResponseData = {
  message: string
}
 
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const searchParams = req.query
  if (!searchParams.name) {
    res.status(200).json({ message: 'tests/selectCat api: name not provided' })
  }
  if (searchParams.name) {
    const name1 = searchParams.name
    if (typeof name1 == 'string') {
      try {
        const { rows } = await sql`SELECT * FROM cats WHERE name=${name1};`;
        if (rows.length > 0) {
          res.status(200).json({ message: 'name ' + name1 + ' already exists in the cat database' })
        } else {
          res.status(200).json({ message: `name ${name1} does not exist in the cat database` })
        }
        res.status(200).json({ message: 'this is the tests/selectCat api' })
      } catch (error) {
        console.log(error)
      }
    } else {
      res.status(200).json({ message: 'the provided name is invalid' })
    }
  }
}