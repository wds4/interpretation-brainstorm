import { InterpProtocolParams_followsAndMutes, RatingsTableObject } from "@/types"
import { db } from "@vercel/postgres";
import { ResponseData } from "./processRequest";

type Obj = Array<string>
type Obj1 = {
  [key: string]: Obj,
}
 type Obj2 = {
  [key: string]: number,
}

const oRatingsTable:RatingsTableObject = { 'notSpam': {}}

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
  return aNextDosPubkeys
}

const returnBrainRecNotBotsRatingsTable = async (parameters: InterpProtocolParams_followsAndMutes) => {
    const defaultFollowsScore = parameters.follows.score
    const defaultFollowsConfidence = parameters.follows.confidence
    const defaultMutesScore = parameters.mutes.score
    const defaultMutesConfidence = parameters.mutes.confidence
    const aSeedPubkeys:string[] = parameters.pubkeys
    const context = parameters.context
    const depth = parameters.depth

    const ratingsTableName = 'default'
    const pubkey1 = aSeedPubkeys[0] // TODO: ? include owner or observer pubkey for instances of multiple seed users

    console.log(`!!!!!! returnBrainRecNotBotsRatingsTable: ${defaultFollowsScore} ${defaultFollowsConfidence} ${defaultMutesScore} ${defaultMutesConfidence} ${JSON.stringify(aSeedPubkeys)} ${context} ${depth} `)

    const client = await db.connect()
    try {
        // TODO: check whether the existing data is recent enough
        const resA = await client.sql`SELECT * FROM customers WHERE pubkey=${pubkey1} AND name=${ratingsTableName}`; 
        if (resA.rowCount == 1) {
          const message = 'Results of your nostr/requestInterpretation query:'
          const oRatingsTable = resA.rows[0].ratingstable
          const dosStats = resA.rows[0].dosstats
          const dosData = JSON.parse(dosStats)
          // const ratingsTableChars = JSON.stringify(oRatingsTable).length
          // const megabyteSize = ratingsTableChars / 1048576
          /*
          const dosData = {
              numUsersInDb: res0.rowCount,
              dos0: lookupPubkeysByDos[0].length,
              dos1: lookupPubkeysByDos[1].length,
              dos2: lookupPubkeysByDos[2].length,
              dos3: lookupPubkeysByDos[3].length,
              dos4: lookupPubkeysByDos[4].length,
              dos5: lookupPubkeysByDos[5].length,
              dos6: lookupPubkeysByDos[6].length,
              dosOver6: lookupPubkeysByDos[999].length,
              ratingsTableChars,
              megabyteSize,
          }
          */
          const response:ResponseData = {
            success: true,
            message,
            dosData,
            ratingsTable: oRatingsTable
          }
          return response
        }

        const res0 = await client.sql`SELECT * FROM users WHERE id < 5000`; // need to turn this into obj[pubkey] = follows
        const lookupFollowsByPubkey:Obj1 = {}
        const lookupDoSByPubkey:Obj2 = {}
        const lookupPubkeysByDos:Obj1 = {}
        lookupPubkeysByDos[0] = aSeedPubkeys
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
                    if (aSeedPubkeys.includes(pk)) {
                        lookupDoSByPubkey[pk] = 0
                    }
                }
            }
        }
        // calculate DoS
        for (let d=0; d<5;d++) {
            lookupPubkeysByDos[d+1] = returnNextDosPubkeys(d,lookupPubkeysByDos,lookupFollowsByPubkey,lookupDoSByPubkey)
        }

        if (res0.rowCount) {
          for (let x=0; x< res0.rowCount; x++) {
            const pk:string = res0.rows[x].pubkey
            const d = lookupDoSByPubkey[pk]
            if (d < 999) {
              // add follows ratings
              const follows = res0.rows[x].follows
              for (let f=0; f<follows.length; f++) {
                const pk_child = follows[f]
                // const rating:Rating = [pk, pk_child, 'notSpam', 1.0, 0.05]
                // ratingsTable.push(rating)
                if (!oRatingsTable.notSpam[pk]) {
                  oRatingsTable.notSpam[pk] = {
                    [pk_child]: [1.0, 0.05]
                  } 
                }
                if (!oRatingsTable.notSpam[pk][pk_child]) {
                  oRatingsTable.notSpam[pk][pk_child] = [1.0, 0.05]
                }
              }
              // add mutes ratings
              const mutes = res0.rows[x].mutes
              for (let m=0; m<mutes.length; m++) {
                const pk_child = mutes[m]
                // const rating:Rating = [pk, pk_child, 'notSpam', 0.0, 0.1]
                // ratingsTable.push(rating)
                if (!oRatingsTable.notSpam[pk]) {
                  oRatingsTable.notSpam[pk] = {
                    [pk_child]: [0.0, 0.1]
                  } 
                }
                if (!oRatingsTable.notSpam[pk][pk_child]) {
                  oRatingsTable.notSpam[pk][pk_child] = [0.0, 0.1]
                }
              }
            }
            if (d == 999) {
              lookupPubkeysByDos[999].push(pk)
            }
          }
        }

        const message = 'Results of your nostr/requestInterpretation query:'
        const ratingsTableChars = JSON.stringify(oRatingsTable).length
        const megabyteSize = ratingsTableChars / 1048576
        const dosData = {
            numUsersInDb: res0.rowCount,
            dos0: lookupPubkeysByDos[0].length,
            dos1: lookupPubkeysByDos[1].length,
            dos2: lookupPubkeysByDos[2].length,
            dos3: lookupPubkeysByDos[3].length,
            dos4: lookupPubkeysByDos[4].length,
            dos5: lookupPubkeysByDos[5].length,
            dos6: lookupPubkeysByDos[6].length,
            dosOver6: lookupPubkeysByDos[999].length,
            ratingsTableChars,
            megabyteSize,
        }

        const response:ResponseData = {
            success: true,
            message,
            dosData,
            ratingsTable: oRatingsTable
        }

        const sRatingsTable = JSON.stringify(oRatingsTable)
        const sDosStats = JSON.stringify(dosData)
        const currentTimestamp = Math.floor(Date.now() / 1000)

        const result_insert = await client.sql`INSERT INTO ratingsTables (name, pubkey) VALUES (${ratingsTableName}, ${pubkey1}) ON CONFLICT DO NOTHING;`
        const result_update = await client.sql`UPDATE ratingsTables SET ratingsTable=${sRatingsTable}, dosStats=${sDosStats}, lastUpdated=${currentTimestamp} WHERE name=${ratingsTableName} AND pubkey=${pubkey1} ;`

        console.log('!!!!!! insert' + typeof result_insert)
        console.log('!!!!!! update' + typeof result_update)

        return response
    } catch (error) {
        console.log(error)
        const response:ResponseData = {
            success: false
        }
        if (typeof error == 'object') {
            response.error = JSON.parse(JSON.stringify(error))
        }
        return response
    } finally {
        client.release()
    }
}

export default returnBrainRecNotBotsRatingsTable