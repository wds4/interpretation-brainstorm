import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";
import processRequest from './processRequest';

/*
Tests:

http://localhost:3000/api/requestInterpretation
http://localhost:3000/api/requestInterpretation?req={"universalInterpretationProtocolID":"recommendedBrainstormNotBotsInterpretationProtocol","parameters":{"context":"notSpam","pubkeys":["e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f"],"depth":5,"follows":{"score":1.0,"confidence":0.05},"mutes":{"score":0.0,"confidence":0.10}}}

https://interpretation-brainstorm.vercel.app/api/requestInterpretation?req={"universalInterpretationProtocolID":"recommendedBrainstormNotBotsInterpretationProtocol","parameters":{"context":"notSpam","pubkeys":["e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f"],"depth":5,"follows":{"score":1.0,"confidence":0.05},"mutes":{"score":0.0,"confidence":0.10}}}

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
        if (!searchParams.req) {
            const res:ResponseData = { success: false, message: "req parameter was not found" }
            response.status(500).json(res)
        }
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

