import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";
import processRequest from './processRequest';

/*
Tests:

https://interpretation-brainstorm.vercel.app/api/requestInterpretation
https://interpretation-brainstorm.vercel.app/api/requestInterpretation?req={"universalInterpretationProtocolID":"recommendedBrainstormNotBotsInterpretationProtocol","parameters":"foo"}

*/

type ResponseData = {
    success: boolean,
    message?: string
}

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
    const client = await db.connect();
    try {
        const searchParams = request.query
        const req = searchParams.req
        if (searchParams.req) {
            let res:ResponseData = { success: false, message: "unknown error" }
            if (typeof req == 'string') {
              res = await processRequest(req)
              response.status(500).json(res)
            } else {
                response.status(500).json(res)
            }
            // response.status(500).json(res)
        }
    } catch (err) {
        console.log(err)
        response.status(500).json({ error: 'failed to load data' })
    } finally {
        client.release();
    }
}

