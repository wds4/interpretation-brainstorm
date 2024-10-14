import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";
import { verifyPubkeyValidity } from '@/helpers/nip19';

/*
usage:
http://localhost:3000/api/manageData/singleUser/createDosSummary?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f

https://interpretation-brainstorm.vercel.app/api/manageData/singleUser/createDosSummary?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f

TODO: option to support npub in addition to pubkey
*/

type ResponseData = {
  success: boolean,
  message: string,
  dosSummary?: object
}

type Obj = number[]
type Obj1 = {
  [key: number]: Obj,
}
 type Obj2 = {
  [key: number]: number,
}

const returnNextDosIds = (dos:number,lookupIdsByDos:Obj1,lookupFollowsById:Obj1,lookupDoSById:Obj2) => {
  const nextMinimumDos = dos + 1
  const aLastDosIds = lookupIdsByDos[dos]
  const aNextDosIds:number[] = []
  for (let p=0; p < aLastDosIds.length; p++) {
    const id_parent = aLastDosIds[p]
    const aFollows = lookupFollowsById[id_parent]
    // console.log(`dos: ${dos}; aLastDosIds: ${JSON.stringify(aLastDosIds)}; p: ${p}; id_parent: ${id_parent}; aFollows: ${JSON.stringify(aFollows)}`)
    for (let c=0; c < aFollows.length; c++) {
      const id_child = aFollows[c]
      const currentlyRecordedDos = lookupDoSById[id_child]
      // console.log(`id_child: ${typeof id_child}; nextMinimumDos: ${nextMinimumDos} currentlyRecordedDos: ${currentlyRecordedDos}`)
      if (nextMinimumDos < currentlyRecordedDos) {
        lookupDoSById[id_child] = nextMinimumDos
        if (!aNextDosIds.includes(id_child)) {
          aNextDosIds.push(id_child)
        }
      }
    }
  }
  console.log(`dos: ${dos}; aLastDosIds: ${JSON.stringify(aLastDosIds)}; aNextDosIds: ${JSON.stringify(aNextDosIds)}`)
  return aNextDosIds
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
      message: 'api/manageData/singleUser/createDosSummary: pubkey not provided',
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
        const res0 = await client.sql`SELECT id, pubkey, observerobject FROM users WHERE whenLastCreatedObserverObject > 0;`; // add more restrictions to limit number of returns
        const resReferenceUser_user = await client.sql`SELECT * FROM users WHERE pubkey=${pubkeyParent};`;
        const resReferenceUser_customer = await client.sql`SELECT * FROM customers WHERE pubkey=${pubkeyParent};`;
        console.log('number of users with observerObjects:' + res0.rowCount)
        console.log(typeof resReferenceUser_user)
        if (res0.rowCount == 1) {
          // ? exit with error message
        }
        if (resReferenceUser_user.rowCount != 1) {
          // ? exit with error message
        }
        const refUserID = resReferenceUser_user.rows[0].id
        const refCustomerID = resReferenceUser_customer.rows[0].id
        // console.log('refUserID: ' + refUserID)
        const aSeedIds = [refUserID]
        const lookupFollowsById:Obj1 = {}
        const lookupDoSById:Obj2 = {}
        const lookupIdsByDos:Obj1 = {}
        lookupIdsByDos[0] = aSeedIds
        lookupIdsByDos[1] = []
        lookupIdsByDos[2] = []
        lookupIdsByDos[3] = []
        lookupIdsByDos[4] = []
        lookupIdsByDos[5] = []
        lookupIdsByDos[6] = []
        lookupIdsByDos[999] = []
        // console.log('lookupIdsByDos: ' + JSON.stringify(lookupIdsByDos, null, 4))
        if (res0.rowCount) {
            for (let x=0; x< res0.rowCount; x++) {
                const id = res0.rows[x].id
                const oO = res0.rows[x].observerobject
                const numFoo = Object.keys(oO).length
                console.log('+++++++++++++++++++++++++++')
                console.log('x: ' + x + '; id: ' + id + '; numFoo: ' + numFoo)
                if (!oO[id]) {
                  lookupFollowsById[id] = []
                  lookupDoSById[id] = 999
                }
                if (oO[id]) {
                    // console.log('YES!!!!!!!!!!!!!!!!!!!!!!!!!')
                    const aFollowsAndMutes = Object.keys(oO[id])
                    // console.log(`aFollowsAndMutes: ${JSON.stringify(aFollowsAndMutes)}`)
                    const aFollows = []
                    for (let z=0;z<aFollowsAndMutes.length;z++) {
                        // console.log(`oO[id][z]: ${oO[id][z]}`)
                        if (oO[id][z] == 'f') {
                            aFollows.push(z)
                        }
                    }
                    // console.log(`aFollows: ${JSON.stringify(aFollows)}`)
                    lookupFollowsById[id] = aFollows
                    // console.log(`====== id: ${id};  lookupFollowsById: ${JSON.stringify(lookupFollowsById[id])}`)
                    lookupDoSById[id] = 999
                    if (aSeedIds.includes(id)) {
                        lookupDoSById[id] = 0
                    }
                }
            }
        }

        // console.log(`lookupFollowsById: ${JSON.stringify(lookupFollowsById,null,4)}`)
        // console.log(`lookupDoSById: ${JSON.stringify(lookupDoSById,null,4)}`)

        // calculate DoS
        for (let d=0; d < 5; d++) {
            lookupIdsByDos[d+1] = returnNextDosIds(d,lookupIdsByDos,lookupFollowsById,lookupDoSById)
        }

        // save dosSummary in table: dosSummaries
        const oDosSummary = {
          numUsersInDb: res0.rowCount,
          dos0: lookupIdsByDos[0].length,
          dos1: lookupIdsByDos[1].length,
          dos2: lookupIdsByDos[2].length,
          dos3: lookupIdsByDos[3].length,
          dos4: lookupIdsByDos[4].length,
          dos5: lookupIdsByDos[5].length,
          dos6: lookupIdsByDos[6].length,
          dosOver6: lookupIdsByDos[999].length
        }
        const sDosSummary = JSON.stringify(oDosSummary)
        await client.sql`INSERT INTO dosSummaries (pubkey, userid, customerid) VALUES(${pubkeyParent}, ${refUserID}, ${refCustomerID}) ON CONFLICT DO NOTHING;`;
        await client.sql`UPDATE dosSummaries SET dosdata=${sDosSummary}, lastupdated=${currentTimestamp} WHERE pubkey=${pubkeyParent};`;
        const response:ResponseData = {
          success: true,
          message: 'api/manageData/singleUser/createDosSummary: made it to the end of the try block',
          dosSummary: oDosSummary
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
        message: 'api/manageData/singleUser/createDosSummary: the provided pubkey is invalid',
      }
      res.status(500).json(response)
    }
  }
}