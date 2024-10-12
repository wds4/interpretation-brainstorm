import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from 'redis';

/*
to access:
http://localhost:3000/api/tests/redis
https://interpretation-brainstorm.vercel.app/api/tests/redis
*/

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
    const client = createClient();
    try {
        await client.connect();
        /*
        await client.set('key1', 'value1');
        const value1 = await client.get('key1');
        console.log('redis value1: ' + value1)
        client.disconnect();
        */
    } catch (error) {
        res.status(500).json({ message: error })
    }
    res.status(200).json({ message: 'Hello from Next.js!' })
}