import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";
import { verifyPubkeyValidity } from '@/helpers/nip19';

/*
usage: 
http://localhost:3000/api/nostr/query/singleUser/dos?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f
https://interpretation-brainstorm.vercel.app/api/nostr/query/singleUser/dos?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f

Returns number of pubkeys for each degree of separation
*/
type ResponseData = {
  message: string,
  userData?: object
}

type Obj = Array<string>
type Obj1 = {
  [key: string]: Obj,
}
 type Obj2 = {
  [key: string]: number,
}

const returnNextDosPubkeys = (dos:number,lookupPubkeysByDos:Obj1,lookupFollowsByPubkey:Obj1,lookupDoSByPubkey:Obj2) => {
  const nextMinimumDos = dos + 1
  const aLastDosPubkeys = lookupPubkeysByDos[dos]
  const aNextDosPubkeys:string[] = []
  for (let p=0; p < aLastDosPubkeys.length; p++) {
    const pk_parent = aLastDosPubkeys[p]
    const aFollows = lookupFollowsByPubkey[pk_parent]
    for (let c=0; c < aFollows.length; c++) {
      const pk_child = aFollows[c]
      const currentlyRecordedDos = lookupDoSByPubkey[pk_child]
      if (nextMinimumDos < currentlyRecordedDos) {
        lookupDoSByPubkey[pk_child] = nextMinimumDos
        if (!aNextDosPubkeys.includes(pk_child)) {
          aNextDosPubkeys.push(pk_child)
        }
      }
    }
  }
  console.log('for dos = ' + dos + ', aNextDosPubkeys.length: ' + aNextDosPubkeys.length)
  return aNextDosPubkeys
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const response: ResponseData = {
    message: '',
    userData: {
      dos1: -1,
      dos2: -1,
      dos3: -1,
      dos4: -1,
      dos5: -1,
      dos6: -1,
      dos999: -1
    }
  }
  const searchParams = req.query
  if (searchParams.npub) {
    // TODO: support npub
  }
  if (!searchParams.pubkey) {
    res.status(200).json({ message: 'nostr/query/singleUser: pubkey not provided' })
  }
  if (searchParams.pubkey) {
    const pubkey1 = searchParams.pubkey
    if ((typeof pubkey1 == 'string') && (verifyPubkeyValidity(pubkey1)) ) {
      const client = await db.connect()
      try {
        const res0 = await client.sql`SELECT * FROM users`; // need to turn this into obj[pubkey] = follows
        const lookupFollowsByPubkey:Obj1 = {}
        const lookupDoSByPubkey:Obj2 = {}
        const lookupPubkeysByDos:Obj1 = {}
        lookupPubkeysByDos[0] = [pubkey1]
        lookupPubkeysByDos[1] = []
        lookupPubkeysByDos[2] = []
        lookupPubkeysByDos[3] = []
        lookupPubkeysByDos[4] = []
        lookupPubkeysByDos[5] = []
        lookupPubkeysByDos[6] = []
        lookupPubkeysByDos[999] = []
        if (res0.rowCount) {
          for (let x=0; x< res0.rowCount; x++) {
            const pk = res0.rows[x].pubkey
            const follows = res0.rows[x].follows
            if (typeof pk == 'string') {
              lookupFollowsByPubkey[pk] = follows
              lookupDoSByPubkey[pk] = 999
              if (pk == pubkey1) {
                lookupDoSByPubkey[pk] = 0
              }
            }
          }
        }

        for (let d=0; d<5;d++) {
          lookupPubkeysByDos[d+1] = returnNextDosPubkeys(d,lookupPubkeysByDos,lookupFollowsByPubkey,lookupDoSByPubkey)
        }
        if (res0.rowCount) {
          for (let x=0; x< res0.rowCount; x++) {
            const pk = res0.rows[x].pubkey
            const d = lookupDoSByPubkey[pk]
            if (d == 999) {
              lookupPubkeysByDos[999].push(pk)
            }
          }
        }
        // const aDos1:string[] = res1.rows[0].follows
        // const aTot:string[] = []

        response.message = 'Results of your nostr/query/singleUser/dos query:'
        response.userData = {
          dos0: lookupPubkeysByDos[0].length,
          dos1: lookupPubkeysByDos[1].length,
          dos2: lookupPubkeysByDos[2].length,
          dos3: lookupPubkeysByDos[3].length,
          dos4: lookupPubkeysByDos[4].length,
          dos5: lookupPubkeysByDos[5].length,
          dos6: lookupPubkeysByDos[6].length,
          dos999: lookupPubkeysByDos[999].length,
        }
        res.status(200).json(response)
      } catch (e) {
        console.log(e)
        response.message = 'error'
        res.status(500).json(response)
      } finally {
        client.release()
      }
    } else {
     response.message = 'error at the nostr/query/singleUser API endpoint: supplied pubkey is invalid!'
      res.status(200).json(response)   
    }
  }
} 