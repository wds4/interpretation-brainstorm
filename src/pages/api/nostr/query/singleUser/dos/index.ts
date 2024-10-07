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

type Obj1 = Array<string>
type Obj = {
  [key: string]: Obj1,
 }


const createNextDosFollowList = (aTotIn:string[], aPrevHopIn:string[],lookupFollowsByPubkey:Obj) => {
  // aPrevHopIn is the set of pubkeys n hops away
  // aNextHopOut will be the set of pubkeys n+1 hops away
  // aPrevHopIn is a subset of aTotIn
  const aTotOut:string[] = JSON.parse(JSON.stringify(aTotIn))
  const aNextHopOut:string[] = []
  // iterate through aPrevHopIn and add follows to aNextHopOut, minus pubkeys that are in aTotIn
  for (let x = 0; x < aPrevHopIn.length; x++) {
    const nextParentPk = aPrevHopIn[x]
    if (lookupFollowsByPubkey[nextParentPk]) {
      const nextFollows = lookupFollowsByPubkey[nextParentPk]
      for (let y = 0; y < nextFollows.length; y++) {
        const nextChildPk = nextFollows[y]
        if (!aTotIn.includes(nextChildPk)) {
          if (!aNextHopOut.includes(nextChildPk)) {
            aNextHopOut.push(nextChildPk)
          }
        }
        if (!aTotOut.includes(nextChildPk)) {
          aTotOut.push(nextChildPk)
        }
      }
    }
  }

  // aTotOut should be the union of aTotIn and aNextHopOut
  return {aTotOut, aNextHopOut}
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
      over6: -1
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
        let lookupFollowsByPubkey:Obj = {}
        if (res0.rowCount) {
          for (let x=0; x< res0.rowCount; x++) {
            const pk = res0.rows[x].pubkey
            const follows = res0.rows[x].follows
            console.log('!!! ============== pk: ' + pk + '; num follows: ' + follows.length)
            if (typeof pk == 'string') {
              lookupFollowsByPubkey[pk] = follows
            }
          }
        }
        const res1 = await client.sql`SELECT * FROM users WHERE pubkey=${pubkey1}`;
        console.log(res1)
        const aDos1:string[] = res1.rows[0].follows
        const aTot:string[] = []

        let foo1 = createNextDosFollowList(aTot,aDos1,lookupFollowsByPubkey)
        const aDos2:string[] = foo1.aNextHopOut
        console.log('typeof foo1.aTotOut: ' + typeof foo1.aTotOut)
        // console.log('foo1.aTotOut: ' + JSON.stringify(foo1.aTotOut))
        console.log('typeof aDos2: ' + typeof aDos2)
        // console.log('aDos2: ' + JSON.stringify(aDos2))

        let foo2 = createNextDosFollowList(foo1.aTotOut,aDos2,lookupFollowsByPubkey)
        const aDos3:string[] = foo2.aNextHopOut
        
        let foo3 = createNextDosFollowList(foo2.aTotOut,aDos3,lookupFollowsByPubkey)
        const aDos4:string[] = foo3.aNextHopOut

        let foo4 = createNextDosFollowList(foo3.aTotOut,aDos4,lookupFollowsByPubkey)
        const aDos5:string[] = foo4.aNextHopOut

        let foo5 = createNextDosFollowList(foo4.aTotOut,aDos5,lookupFollowsByPubkey)
        const aDos6:string[] = foo5.aNextHopOut

        response.message = 'Results of your nostr/query/singleUser/dos query:'
        response.userData = {
          dos1: aDos1.length,
          dos2: aDos2.length,
          dos3: aDos3.length,
          dos4: aDos4.length,
          dos5: aDos5.length,
          dos6: aDos6.length,
          over6: -1
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