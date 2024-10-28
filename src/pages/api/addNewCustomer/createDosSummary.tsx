import { db } from "@vercel/postgres"

type Obj = number[]
type Obj1 = {
  [key: number]: Obj,
}
 type Obj2 = {
  [key: number]: number,
}

const returnNextDosIds = (dos:number,lookupIdsByDos:Obj1,lookupFollowsById:Obj1,lookupDoSById:Obj2,refUserID:number) => {
    console.log(`returnNextDosIds A`)
    const aNextDosIds:number[] = []
    const nextMinimumDos:number = dos + 1
    const aLastDosIds = lookupIdsByDos[dos]
    // console.log(`returnNextDosIds B`)
    for (let p=0; p < aLastDosIds.length; p++) {
      // console.log(`returnNextDosIds C; p: ${p}`)
      const id_parent = aLastDosIds[p]
      // console.log(`returnNextDosIds D; p: ${p}; id_parent: ${id_parent}`)
      let aFollows:number[] = []
      if (lookupFollowsById[id_parent]) {
        aFollows = lookupFollowsById[id_parent]
      }
      for (let c=0; c < aFollows.length; c++) {
        const id_child = aFollows[c]
        if (id_child == refUserID) {
          // console.log(`=============== id_child ${id_child} = refUserID ${refUserID}: ============`)
        }
        let currentlyRecordedDos = 999
        if (lookupDoSById.hasOwnProperty(id_child)) {
          currentlyRecordedDos = lookupDoSById[id_child]
        }
        if (id_child == refUserID) {
          // console.log(`for id_child: ${id_child}, currentlyRecordedDos: ${currentlyRecordedDos} ============`)
        }
        if (nextMinimumDos < currentlyRecordedDos) {
          lookupDoSById[id_child] = nextMinimumDos
          if (!aNextDosIds.includes(id_child)) {
            aNextDosIds.push(id_child)
            if (id_child == 1) {
              console.log(`pushing ${id_child} into aNextDosIds; dos: ${dos}`)
              if (id_child == refUserID) {
                // console.log(`=============== pushing id_child ${id_child} = refUserID ${refUserID} into dos: ${dos}; nextMinimumDos: ${nextMinimumDos} currentlyRecordedDos: ${currentlyRecordedDos} ============`)
              }
            }
          }
        }
      }
    }
    return aNextDosIds
  }

export const createDosSummary = async (pubkeyParent:string) => {
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const client = await db.connect();
    const resUsersWithOo = await client.sql`SELECT id, observerobject FROM users WHERE whenLastCreatedObserverObject > 0;`;
    const resReferenceUser_user = await client.sql`SELECT * FROM users WHERE pubkey=${pubkeyParent};`;
    const resReferenceUser_customer = await client.sql`SELECT * FROM customers WHERE pubkey=${pubkeyParent};`;
    console.log('number of users with observerObjects:' + resUsersWithOo.rowCount)
    const refUserID = resReferenceUser_user.rows[0].id
    const refCustomerID = resReferenceUser_customer.rows[0].id
    const aSeedIds = [refUserID]
    const lookupFollowsById:Obj1 = {}
    const lookupDoSById:Obj2 = {}
    const lookupIdsByDos:Obj1 = {}
    lookupIdsByDos[0] = aSeedIds
    for (let z=1; z < 20; z++) {
      lookupIdsByDos[z] = []
    }
    lookupIdsByDos[999] = []
    console.log(`lookupIdsByDos: ${JSON.stringify(lookupIdsByDos, null, 4)}`)
    if (resUsersWithOo.rowCount) {
      for (let x=0; x< resUsersWithOo.rowCount; x++) {
        const id = resUsersWithOo.rows[x].id
        const oO = resUsersWithOo.rows[x].observerobject
        lookupDoSById[id] = 999
        lookupFollowsById[id] = []
        if (oO[id]) {
          const aRatees = Object.keys(oO[id])
          for (let r=0; r < aRatees.length; r++) {
            const id_ratee = Number(aRatees[r])
            if (oO[id][id_ratee] == 'f') {
              lookupFollowsById[id].push(id_ratee)
            }
          }
        }
      }
    }
    console.log(`lookupFollowsById length: ${Object.keys(lookupFollowsById).length}`)
    for (let u=0; u < aSeedIds.length; u++) {
      const nextSeedId = aSeedIds[u]
      lookupDoSById[nextSeedId] = 0
    }

    for (let d=0; d < 10; d++) {
      lookupIdsByDos[d+1] = returnNextDosIds(d,lookupIdsByDos,lookupFollowsById,lookupDoSById,refUserID)
      console.log(`d: ${d}; length of lookupIdsByDos[d+1]: ${lookupIdsByDos[d+1].length} `)
    }

    const lookupIdsByDosNumerOfChars = JSON.stringify(lookupIdsByDos).length
    const lookupIdsByDosMegabyteSize = lookupIdsByDosNumerOfChars / 1048576

    const oDosSummary = {
      numUsersWithKnownObserverObject: resUsersWithOo.rowCount,
      fullReportSizeInMegabytes: lookupIdsByDosMegabyteSize,
      dos0: lookupIdsByDos[0].length,
      dos1: lookupIdsByDos[1].length,
      dos2: lookupIdsByDos[2].length,
      dos3: lookupIdsByDos[3].length,
      dos4: lookupIdsByDos[4].length,
      dos5: lookupIdsByDos[5].length,
      dos6: lookupIdsByDos[6].length,
      dos7: lookupIdsByDos[7].length,
      dos8: lookupIdsByDos[8].length,
      dos9: lookupIdsByDos[9].length,
      dos10: lookupIdsByDos[10].length,
      dos11: lookupIdsByDos[11].length,
      dos12: lookupIdsByDos[12].length,
      dos13: lookupIdsByDos[13].length,
      dos14: lookupIdsByDos[14].length,
      dos15: lookupIdsByDos[15].length,
      dos999: lookupIdsByDos[999].length
    }
    const sDosSummary = JSON.stringify(oDosSummary)
    const sLookupIdsByDos = JSON.stringify(lookupIdsByDos)
    await client.sql`INSERT INTO dosSummaries (pubkey, userid, customerid) VALUES(${pubkeyParent}, ${refUserID}, ${refCustomerID}) ON CONFLICT DO NOTHING;`;
    await client.sql`UPDATE dosSummaries SET lookupidsbydos=${sLookupIdsByDos}, dosdata=${sDosSummary}, lastupdated=${currentTimestamp} WHERE pubkey=${pubkeyParent};`;
    client.release();
    return 'success'
}