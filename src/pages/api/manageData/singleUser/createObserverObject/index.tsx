import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";
import { verifyPubkeyValidity } from '@/helpers/nip19';
import { ObserverObjectV0Compact } from '@/typesUpdated';
// import 'websocket-polyfill'

/*
usage:
http://localhost:3000/api/manageData/singleUser/createObserverObject?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f

https://interpretation-brainstorm.vercel.app/api/manageData/singleUser/createObserverObject?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f

TODO: option to support npub in addition to pubkey
*/


type ResponseData = {
  success: boolean,
  message: string,
  userData?: object
}

type IdLookup = {
  [key: string]: string
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
      message: 'api/manageData/singleUser/createObserverObject: pubkey not provided',
    }
    res.status(500).json(response)
  }
  if (searchParams.pubkey) {
    const pubkeyParent = searchParams.pubkey
    if ((typeof pubkeyParent == 'string') && (verifyPubkeyValidity(pubkeyParent)) ) {
      const client = await db.connect();
      const currentTimestamp = Math.floor(Date.now() / 1000)
      try {
        const res0 = await client.sql`SELECT id, pubkey FROM users;`;
        const res1 = await client.sql`SELECT * FROM users WHERE pubkey=${pubkeyParent};`;
        
        const observerObject:ObserverObjectV0Compact = {}
        const idLookup:IdLookup = {}
        if (res0.rowCount) {
          for (let x=0; x < res0.rowCount; x++) {
            const id = res0.rows[x].id;
            const pubkey = res0.rows[x].pubkey;
            idLookup[pubkey] = id;
          }
        }
        if (res1.rowCount == 1) {
          const idParent = res1.rows[0].id
          // we process mutes first
          const aMutes = res1.rows[0].mutes;
          for (let x=0; x < aMutes.length; x++) {
            const pk = aMutes[x];
            let identifier = pk
            if (idLookup[pk]) {
              identifier = idLookup[pk]
            }
            if (identifier != idParent) { // NO SELF RATING
              if (!observerObject[idParent]) {
                observerObject[idParent] = {
                  identifier: 'm'
                }
              } else {
                observerObject[idParent][identifier] = 'm'
              }
            }
          }
          // we process follows after mutes
          // **** NOTE THAT THIS METHOD MEANS THAT A FOLLOW OVERWRITES A MUTE
          // SO IF ALICE FOLLOWS BOB BUT ALSO MUTES BOB,
          // THE MUTE GETS IGNORED BC IT IS OVERWRITTEN IN THIS STEP
          const aFollows = res1.rows[0].follows;
          for (let x=0; x < aFollows.length; x++) {
            const pk = aFollows[x];
            let identifier = pk
            if (idLookup[pk]) {
              identifier = idLookup[pk]
            }
            if (identifier != idParent) {
              if (!observerObject[idParent]) {
                observerObject[idParent] = {
                  identifier: 'f'
                }
              } else {
                observerObject[idParent][identifier] = 'f'
              }
            }
          }
          const sObserverObject = JSON.stringify(observerObject)
          // console.log('observerObject: ' + JSON.stringify(observerObject, null, 4))
          await client.sql`UPDATE users SET observerObject=${sObserverObject}, follows='[]', mutes='[]', whenlastcreatedobserverobject = ${currentTimestamp} WHERE pubkey = ${pubkeyParent}`;
          const response:ResponseData = {
            success: true,
            message: 'api/manageData/singleUser/createObserverObject results:',
            userData: {
              pubkey: res1.rows[0].pubkey,
              numRows: res1.rowCount,
              numFollows: aFollows.length,
              numMutes: aMutes.length,
              observerObject
            }
          }
          res.status(200).json(response)

        }
        const response:ResponseData = {
          success: true,
          message: 'api/manageData/singleUser/createObserverObject: made it to the end of the try block'
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
        console.log('releasing the db client now')
        client.release();
      }
    } else {
      const response:ResponseData = {
        success: false,
        message: 'api/manageData/singleUser/createObserverObject: the provided pubkey is invalid',
      }
      res.status(500).json(response)
    }
  }
}