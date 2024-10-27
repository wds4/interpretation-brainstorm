import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";
import { verifyPubkeyValidity } from '@/helpers/nip19';

/*
This endpoint determines which if any updates need to be performed for the indicated user and truggers the next one that needs to be done

usage:
straycat
pubkey: e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f
http://localhost:3000/api/manageData/singleUser/controller?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f

https://interpretation-brainstorm.vercel.app/api/manageData/singleUser/controller?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f

darthMcTesty
pubkey: a08175d65051c08b83600abf6f5c18efd455114b4863c65959c92b13ee52f87c
http://localhost:3000/api/manageData/singleUser/controller?pubkey=a08175d65051c08b83600abf6f5c18efd455114b4863c65959c92b13ee52f87c

https://interpretation-brainstorm.vercel.app/api/manageData/singleUser/controller?pubkey=a08175d65051c08b83600abf6f5c18efd455114b4863c65959c92b13ee52f87c

tonyStark
pubkey: 043df008b847b66bf991dfb696aac68973eccfa4cedfb87173df79a4cf666ea7
http://localhost:3000/api/manageData/singleUser/controller?pubkey=043df008b847b66bf991dfb696aac68973eccfa4cedfb87173df79a4cf666ea7

https://interpretation-brainstorm.vercel.app/api/manageData/singleUser/controller?pubkey=043df008b847b66bf991dfb696aac68973eccfa4cedfb87173df79a4cf666ea7

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
  const searchParams = req.query
  if (searchParams.npub) {
    // TODO: support npub
  }
  if (!searchParams.pubkey) {
    const response:ResponseData = {
      success: false,
      message: 'api/manageData/singleUser/controller: pubkey not provided',
    }
    res.status(500).json(response)
  }
  if (searchParams.pubkey) {
    const pubkeyParent = searchParams.pubkey
    if ((typeof pubkeyParent == 'string') && (verifyPubkeyValidity(pubkeyParent)) ) {
      const client = await db.connect();
      console.log('============ connecting the db client now')
      const currentTimestamp = Math.floor(Date.now() / 1000)
      try {
        const resReferenceUser_user = await client.sql`SELECT * FROM users WHERE pubkey=${pubkeyParent};`;
        const resReferenceUser_customer = await client.sql`SELECT * FROM customers WHERE pubkey=${pubkeyParent};`;
        if (!resReferenceUser_customer.rowCount) {
          const response:ResponseData = {
            success: false,
            message: `api/manageData/singleUser/controller: ${pubkeyParent} is not a customer`,
          }
          res.status(500).json(response)
        }
        if (resReferenceUser_customer.rowCount && resReferenceUser_user.rowCount) {
          // TODO: add customer to the users table (should not typically have to do this)
        }
        const customerId = resReferenceUser_customer.rows[0].id
        let whenSignedUp = resReferenceUser_customer.rows[0].whensignedup
        if (!whenSignedUp) {
          whenSignedUp = 0
        }
        const resReferenceUser_ratingsTables = await client.sql`SELECT lastUpdated FROM ratingsTables WHERE customerId=${customerId};`;
        const resReferenceUser_scorecardsTables = await client.sql`SELECT lastUpdated FROM scorecardsTables WHERE customerId=${customerId};`;
        const resReferenceUser_dosSummaries = await client.sql`SELECT lastUpdated FROM dosSummaries WHERE customerId=${customerId};`;
        
        let lastUpdated_ratingsTables = 0
        let lastUpdated_scorecardsTables = 0
        let lastUpdated_dosSummaries = 0
        if (resReferenceUser_ratingsTables.rowCount) {
          lastUpdated_ratingsTables = resReferenceUser_ratingsTables.rows[0].lastupdated
        }
        if (resReferenceUser_scorecardsTables.rowCount) {
          lastUpdated_scorecardsTables = resReferenceUser_scorecardsTables.rows[0].lastupdated
        }
        if (resReferenceUser_dosSummaries.rowCount) {
          lastUpdated_dosSummaries = resReferenceUser_dosSummaries.rows[0].lastupdated
        }

        let follows = []
        let mutes = []
        let followsCreatedAt = 0
        let mutesCreatedAt = 0
        let haveFollowsAndMutesBeenInput = false

        let doesObserverObjectExist = 'yes'
        let sObserverObject = ''

        let lastCreated_observerObject = 0
        let lastQueried_followsAndMutes = 0
        let lastInput_followsAndMutes = 0

        let observerObject = {}

        if (resReferenceUser_user.rowCount) {
          observerObject = resReferenceUser_user.rows[0].observerobject
          lastCreated_observerObject = resReferenceUser_user.rows[0].whenlastcreatedobserverobject
          lastQueried_followsAndMutes = resReferenceUser_user.rows[0].whenlastqueriedfollowsandmutes
          console.log(`observerObject: ${typeof observerObject}`)
          sObserverObject = JSON.stringify(observerObject)
          if (JSON.stringify(observerObject) == '{}') {
            doesObserverObjectExist = 'no'
          }

          follows = resReferenceUser_user.rows[0].follows
          mutes = resReferenceUser_user.rows[0].mutes
          followsCreatedAt = resReferenceUser_user.rows[0].followscreatedat
          mutes = resReferenceUser_user.rows[0].mutes
          mutesCreatedAt = resReferenceUser_user.rows[0].mutescreatedat
          haveFollowsAndMutesBeenInput = resReferenceUser_user.rows[0].havefollowsandmutesbeeninput
          lastInput_followsAndMutes = resReferenceUser_user.rows[0].whenlastinputfollowsandmutesattempt
          console.log(`followsCreatedAt: ${followsCreatedAt}; follows: ${JSON.stringify(follows)}`)
          console.log(`mutesCreatedAt: ${mutesCreatedAt}; mutes: ${typeof mutes}`)
          if (haveFollowsAndMutesBeenInput == true) {
            console.log(`haveFollowsAndMutesBeenInput is true`)
          }
          if (haveFollowsAndMutesBeenInput == false) {
            console.log(`haveFollowsAndMutesBeenInput is false`)
          }
        }

        /* determine whether any endpoint needs to be triggered */
        let urlToTrigger = ``
        let nextAction = ''
        /*
        need to trigger addNewCustomer if:
        - whenSignedUp == 0
        */ 
        if (whenSignedUp == 0) {
          nextAction = `addNewCustomer`
          urlToTrigger = `https://calculation-brainstorm.vercel.app/api/grapevine/addNewCustomer?pubkey=${pubkeyParent}&nextStep=true`
        }

        /*
        need to trigger singleUser/listener if:
        - observerObject is empty AND 0 follows, 0 mutes 
        */ 
        if ((whenSignedUp > 0) && (JSON.stringify(observerObject) == '{}') && !follows.length && !mutes.length) {
          nextAction = `singleUserListener`
          urlToTrigger = `https://interpretation-brainstorm.vercel.app/api/nostr/listeners/singleUser?pubkey=${pubkeyParent}&nextStep=true`
        }

        /*
        need to trigger createObserverObject if:
        observerObject is empty AND (follows.length OR mutes.length)
        */
        if ((whenSignedUp > 0) && (JSON.stringify(observerObject) == '{}') && (follows.length || mutes.length)) {
        nextAction = `createObserverObject`
        urlToTrigger = `https://interpretation-brainstorm.vercel.app/api/manageData/singleUser/createObserverObject?pubkey=${pubkeyParent}&nextStep=true`
       }

        /*
        need to trigger createDosSummary if:
        observerObject is nonempty AND lastUpdated_dosSummaries == 0
        */
        if ((whenSignedUp > 0) && (JSON.stringify(observerObject) != '{}') && (lastUpdated_dosSummaries == 0)) {
          nextAction = `createDosSummary`
          urlToTrigger = `https://interpretation-brainstorm.vercel.app/api/manageData/singleUser/createDosSummary?pubkey=${pubkeyParent}&nextStep=true`
        }

        /*
        need to trigger requestInterpretation if:
        lastUpdated_dosSummaries > 0
        AND
        lastUpdated_ratingsTables == 0
        */
        if ((whenSignedUp > 0) && (lastUpdated_dosSummaries > 0) && (lastUpdated_ratingsTables == 0)) {
          nextAction = `requestInterpretation`
          urlToTrigger = `https://interpretation-brainstorm.vercel.app/api/requestInterpretation?req={"universalInterpretationProtocolID":"recommendedBrainstormNotBotsInterpretationProtocol","parameters":{"context":"notSpam","pubkeys":["${pubkeyParent}"],"depth":5,"follows":{"score":1.0,"confidence":0.05},"mutes":{"score":0.0,"confidence":0.10}}}&nextStep=true`
        }

        /*
        need to trigger calculate/basicNetwork if:
        lastUpdated_ratingsTables > 0
        AND
        lastUpdated_scorecardsTables == 0
        */
        if ((whenSignedUp > 0) && (lastUpdated_ratingsTables > 0) && (lastUpdated_scorecardsTables == 0)) {
          nextAction = `calculateBasicNetwork`
          urlToTrigger = `https://calculation-brainstorm.vercel.app/api/grapevine/calculate/basicNetwork?name=default&pubkey=${pubkeyParent}`
        }

        const response:ResponseData = {
          success: true,
          message: 'api/manageData/singleUser/controller: made it to the end of the try block',
          data: {
            whenSignedUp,
            currentTimestamp,
            followsCreatedAt,
            mutesCreatedAt,
            numFollows: follows.length,
            numMutes: mutes.length,
            sObserverObject,
            doesObserverObjectExist,
            haveFollowsAndMutesBeenInput,
            lastQueried_followsAndMutes,
            lastInput_followsAndMutes,
            lastUpdated_dosSummaries,
            lastCreated_observerObject,
            lastUpdated_ratingsTables,
            lastUpdated_scorecardsTables,
            nextAction,
            urlToTrigger,
          }
        }
        res.status(200).json(response)
      } catch (error) {
        console.log(error)
        const response:ResponseData = {
          success: false,
          message: 'error: ' + error
        }
        res.status(500).json(response)
      }
      finally {
        console.log('============ releasing the db client now')
        client.release();
      }
    } else {
      const response:ResponseData = {
        success: false,
        message: 'api/manageData/singleUser/controller: the provided pubkey is invalid',
      }
      res.status(500).json(response)
    }
  }
}