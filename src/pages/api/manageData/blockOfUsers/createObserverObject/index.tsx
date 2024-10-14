import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";
import { ObserverObjectV0Compact } from '@/typesUpdated';

/*
usage:
http://localhost:3000/api/manageData/blockOfUsers/createObserverObject?n=10

https://interpretation-brainstorm.vercel.app/api/manageData/blockOfUsers/createObserverObject?n=10

This endpoint searches for follows and mutes from a block of pubkeys
and enters them into the intepretation engine database. 
The newly added rows in the database are the only rows that are updated.
*/

type ResponseData = {
  success: boolean,
  message: string,
  data?: object
}

type IdLookup = {
  [key: string]: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const searchParams = req.query
  let numUsers = 10 // the default number of users to update
  if (searchParams.n) {
    numUsers = Number(searchParams.n)
  }
  const startTimestamp = Date.now()
  const client = await db.connect();
  const currentTimestamp = Math.floor(Date.now() / 1000)
  try {
      const res0 = await client.sql`SELECT id, pubkey FROM users;`;
      const res1 = await client.sql`SELECT * FROM users WHERE JSONB_ARRAY_LENGTH(follows) != 0 ORDER BY whenlastcreatedobserverobject ASC LIMIT ${numUsers};`;
      const idLookup:IdLookup = {}
      if (res0.rowCount) {
        for (let x=0; x < res0.rowCount; x++) {
          const id = res0.rows[x].id;
          const pubkey = res0.rows[x].pubkey;
          idLookup[pubkey] = id;
        }
      }
      if (res1.rowCount) {
          // create the observerObject for each user in res1
          for (let u=0; u < res1.rowCount; u++) {
              const observerObject:ObserverObjectV0Compact = {}
              const pubkeyParent = res1.rows[u].pubkey
              const idParent = res1.rows[u].id
              observerObject[idParent] = {}
              // we process mutes first
              const aMutes = res1.rows[u].mutes;
              for (let x=0; x < aMutes.length; x++) {
                  const pk = aMutes[x];
                  let identifier = pk
                  if (idLookup[pk]) {
                      identifier = idLookup[pk]
                  }
                  if (identifier != idParent) { // NO SELF RATING
                      observerObject[idParent][identifier] = 'm'
                  }
              }
              // we process follows after mutes
              // **** NOTE THAT THIS METHOD MEANS THAT A FOLLOW OVERWRITES A MUTE
              // SO IF ALICE FOLLOWS BOB BUT ALSO MUTES BOB,
              // THE MUTE GETS IGNORED BC IT IS OVERWRITTEN IN THIS STEP
              const aFollows = res1.rows[u].follows;
              for (let x=0; x < aFollows.length; x++) {
                  const pk = aFollows[x];
                  let identifier = pk
                  if (idLookup[pk]) {
                      identifier = idLookup[pk]
                  }
                  if (identifier != idParent) { // NO SELF RATING
                      observerObject[idParent][identifier] = 'f'
                  }
              }
              const sObserverObject = JSON.stringify(observerObject)
              // console.log('observerObject: ' + JSON.stringify(observerObject, null, 4))
              await client.sql`UPDATE users SET observerObject=${sObserverObject}, follows='[]', mutes='[]', whenlastcreatedobserverobject = ${currentTimestamp} WHERE pubkey = ${pubkeyParent}`;
          }
          const endTimestamp = Date.now()
          const duration = endTimestamp - startTimestamp + ' msec'
          const response:ResponseData = {
            success: true,
            message: 'api/manageData/blockOfUsers/createObserverObject results:',
            data: {
              duration: duration
            }
          }
          res.status(200).json(response)
      }
  } catch (error) {
    console.log(error)
    const response:ResponseData = {
      success: false,
      message: 'error: ' + error
    }
    res.status(500).json(response)
  } finally {
    console.log('releasing the db client now')
    client.release();
  }
}