import type { NextApiRequest, NextApiResponse } from 'next'
 
/*
http://localhost:3000/api/tests/testGetRequest?request={"a":"b"}
*/

export default function handler(request: NextApiRequest, response: NextApiResponse) {
  if (request.method === 'POST') {
    // Process a POST request
    try {
      // const result = await someAsyncOperation()
      /*
      response.status(200).json('This is a POST')
      // or:
      */
      response.status(200).send('This is a POST')
    } catch (err) {
      console.log(err)
      response.status(500).json({ error: 'failed to load data' })
    }
  } else {
    // Handle any other HTTP method
    try {
      // const result = await someAsyncOperation()
      const searchParams = request.query
      if (searchParams.request) {
        response.status(200).send("Success; request: " + searchParams.request)
        // or:
        // response.status(200).json("Success; request: " + searchParams.request)
      }
    } catch (err) {
      console.log(err)
      response.status(500).json({ error: 'failed to load data' })
    }
  }
}