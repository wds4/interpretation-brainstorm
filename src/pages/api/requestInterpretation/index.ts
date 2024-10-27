import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";
import processRequest, { ResponseData } from './processRequest';

/*
Tests:

e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f

http://localhost:3000/api/requestInterpretation?req={"universalInterpretationProtocolID":"recommendedBrainstormNotBotsInterpretationProtocol","parameters":{"context":"notSpam","pubkeys":["e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f"],"depth":5,"follows":{"score":1.0,"confidence":0.05},"mutes":{"score":0.0,"confidence":0.10}}}

https://interpretation-brainstorm.vercel.app/api/requestInterpretation?req={"universalInterpretationProtocolID":"recommendedBrainstormNotBotsInterpretationProtocol","parameters":{"context":"notSpam","pubkeys":["e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f"],"depth":5,"follows":{"score":1.0,"confidence":0.05},"mutes":{"score":0.0,"confidence":0.10}}}

a08175d65051c08b83600abf6f5c18efd455114b4863c65959c92b13ee52f87c

http://localhost:3000/api/requestInterpretation?req={"universalInterpretationProtocolID":"recommendedBrainstormNotBotsInterpretationProtocol","parameters":{"context":"notSpam","pubkeys":["a08175d65051c08b83600abf6f5c18efd455114b4863c65959c92b13ee52f87c"],"depth":5,"follows":{"score":1.0,"confidence":0.05},"mutes":{"score":0.0,"confidence":0.10}}}

https://interpretation-brainstorm.vercel.app/api/requestInterpretation?req={"universalInterpretationProtocolID":"recommendedBrainstormNotBotsInterpretationProtocol","parameters":{"context":"notSpam","pubkeys":["a08175d65051c08b83600abf6f5c18efd455114b4863c65959c92b13ee52f87c"],"depth":5,"follows":{"score":1.0,"confidence":0.05},"mutes":{"score":0.0,"confidence":0.10}}}

043df008b847b66bf991dfb696aac68973eccfa4cedfb87173df79a4cf666ea7 (tonyStark)

http://localhost:3000/api/requestInterpretation?nextStep=true&req={"universalInterpretationProtocolID":"recommendedBrainstormNotBotsInterpretationProtocol","parameters":{"context":"notSpam","pubkeys":["043df008b847b66bf991dfb696aac68973eccfa4cedfb87173df79a4cf666ea7"],"depth":5,"follows":{"score":1.0,"confidence":0.05},"mutes":{"score":0.0,"confidence":0.10}}}

https://interpretation-brainstorm.vercel.app/api/requestInterpretation?req={"universalInterpretationProtocolID":"recommendedBrainstormNotBotsInterpretationProtocol","parameters":{"context":"notSpam","pubkeys":["043df008b847b66bf991dfb696aac68973eccfa4cedfb87173df79a4cf666ea7"],"depth":5,"follows":{"score":1.0,"confidence":0.05},"mutes":{"score":0.0,"confidence":0.10}}}


*/

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
                if (res.success) {
                    if (res.ratingsWithMetaData && res.ratingsWithMetaData.metaData) {
                        const pubkey1 = res.ratingsWithMetaData.metaData.observer
                        if (searchParams.nextStep && searchParams.nextStep == 'true') {
                            const url = `https://calculation-brainstorm.vercel.app/api/grapevine/calculate/basicNetwork?name=default&pubkey=${pubkey1}&sendMessageConfirmation=true`
                            console.log(`url: ${url}`)
                            const triggerNextEndpoint = (url:string) => {
                                fetch(url)
                            }
                            triggerNextEndpoint(url)
                        }
                    }
                    response.status(200).json(res)
                }

                if (!res.success) {
                    response.status(500).json(res)
                }
                
            } else {
                response.status(500).json(res)
            }
        }
    } catch (err) {
        console.log(err)
        response.status(500).json({ error: 'failed to load data' })
    } finally {
        client.release();
    }
}

