import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";
import { verifyPubkeyValidity } from '@/helpers/nip19';
import { createDosSummary } from './createDosSummary';

/*
Unlike the addNewCustomer endpoint at calculation-brainstorm.vercel.app, which signs up a new customer and nothing more,
this endpoint will trigger the requisite steps to get scorecards generated, using the param:

finishSetup=true

It makes use of the fact that for most users, all steps up through createObserverObject will have already been performed,
and the next necessary sequence of steps will be:
- createDosSummary
- requestInterpretation
- calculateBasicNetwork

So we check whether this is the case and if so, execute them one at a time

to access:
e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f (straycat)
http://localhost:3000/api/addNewCustomer?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f

https://interpretation-brainstorm.vercel.app/api/addNewCustomer?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f

043df008b847b66bf991dfb696aac68973eccfa4cedfb87173df79a4cf666ea7 (tonyStark)
http://localhost:3000/api/addNewCustomer?pubkey=043df008b847b66bf991dfb696aac68973eccfa4cedfb87173df79a4cf666ea7&finishSetup=true

https://interpretation-brainstorm.vercel.app/api/addNewCustomer?pubkey=043df008b847b66bf991dfb696aac68973eccfa4cedfb87173df79a4cf666ea7&finishSetup=true

53dab47395542b4df9c9d5b32934403b751f0a882e69bb8dd8a660df3a95f02d (prettyGood)
http://localhost:3000/api/addNewCustomer?pubkey=53dab47395542b4df9c9d5b32934403b751f0a882e69bb8dd8a660df3a95f02d&finishSetup=true

https://interpretation-brainstorm.vercel.app/api/addNewCustomer?pubkey=53dab47395542b4df9c9d5b32934403b751f0a882e69bb8dd8a660df3a95f02d&finishSetup=true

*/

type ResponseData = {
  success: boolean
  message: string
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
      message: 'grapevine/addNewCustomer api: pubkey not provided',
    }
    res.status(500).json(response)
  }
  if (searchParams.pubkey) {
    const pubkey1 = searchParams.pubkey
    if ((typeof pubkey1 == 'string') && (verifyPubkeyValidity(pubkey1)) ) {
      const client = await db.connect();
      try {
        const result_exists = await client.sql`SELECT EXISTS(SELECT 1 FROM customers WHERE pubkey=${pubkey1}) AS "exists"`
        console.log(result_exists)
        if (result_exists.rows[0].exists == true) {
          // do nothing
          console.log('pubkey already exists in database')
          const response:ResponseData = {
            success: false,
            message: `pubkey ${pubkey1} already exists in the customer database`,
          }
          res.status(200).json(response)
        } else {
          const currentTimestamp = Math.floor(Date.now() / 1000)
          console.log('pubkey needs to be inserted!!!')

          const foo1 = await client.sql`INSERT INTO customers (pubkey, whensignedup) VALUES (${pubkey1}, ${currentTimestamp}) ON CONFLICT DO NOTHING;`
          console.log('foo1:')
          console.log(foo1)

          const foo2 = await client.sql`INSERT INTO users (pubkey) VALUES (${pubkey1}) ON CONFLICT DO NOTHING;`
          console.log('foo2:')
          console.log(foo2)
          
          const result_customers = await client.sql`SELECT id FROM customers WHERE pubkey=${pubkey1}`
          console.log('result_customers:')
          console.log(result_customers)
          
          const result_users = await client.sql`SELECT * FROM users WHERE pubkey=${pubkey1}`
          console.log('result_users:')
          const resReferenceUser_dosSummaries = await client.sql`SELECT lastUpdated FROM dosSummaries WHERE pubkey=${pubkey1};`;
  
          const customerID = result_customers.rows[0].id
          const userID = result_users.rows[0].id
    
          await client.sql`INSERT INTO dosSummaries (pubkey, customerid, userid) VALUES (${pubkey1}, ${customerID}, ${userID}) ON CONFLICT DO NOTHING;`
          await client.sql`INSERT INTO ratingsTables (pubkey, customerid) VALUES (${pubkey1}, ${customerID}) ON CONFLICT DO NOTHING;`
          await client.sql`INSERT INTO scorecardsTables (pubkey, customerid) VALUES (${pubkey1}, ${customerID}) ON CONFLICT DO NOTHING;`

          client.release();

          let observerObject = {}
          let lastUpdated_dosSummaries = 0
          if (result_users.rowCount) {
            observerObject = result_users.rows[0].observerobject
            if (resReferenceUser_dosSummaries.rowCount) {
              lastUpdated_dosSummaries = resReferenceUser_dosSummaries.rows[0].lastupdated
            }
            // assume observerObject already created 
            // TODO: createObserverObject if necessary 

            // createDosSummary 
            if (JSON.stringify(observerObject) != '{}') {
              if (lastUpdated_dosSummaries == 0) {
                // createDosSummary 
                const createDosSummaryResult = await createDosSummary(pubkey1)
                console.log(`createDosSummaryResult: ${createDosSummaryResult}`)
              }
            }
            
            // requestInterpretation
            const url1 = `https://interpretation-brainstorm.vercel.app/api/requestInterpretation?req={"universalInterpretationProtocolID":"recommendedBrainstormNotBotsInterpretationProtocol","parameters":{"context":"notSpam","pubkeys":["${pubkey1}"],"depth":5,"follows":{"score":1.0,"confidence":0.05},"mutes":{"score":0.0,"confidence":0.10}}}&nextStep=true`
            console.log(`about to request interpretation using url: ${url1}`)
            fetch(url1)

            // calculateBasicNetwork

          }

          const response:ResponseData = {
            success: true,
            message: `pubkey ${pubkey1} inserted successfully into the customer, user, dosSummaries, and ratingsTables tables`,
          }
          res.status(200).json(response)
        }
      } catch (error) {
        console.log(error)
      } finally {
        // client.release();
      }
    } else {
      const response:ResponseData = {
        success: false,
        message: 'the provided pubkey is invalid',
      }
      res.status(500).json(response)
    }
  }
}