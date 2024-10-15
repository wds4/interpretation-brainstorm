import { InterpProtocolParams_followsAndMutes } from "@/types"
import { db } from "@vercel/postgres";
import { ResponseData } from "./processRequest";
import { arrayToObject } from "@/helpers";
import { rater, RaterObjectV0o, RatingsV0o, RatingsWithMetaDataV0o } from "@/typesUpdated";

const addObserverObjectToRatingsTable = (oRatingsTable:RatingsV0o,oO:RaterObjectV0o,rater:rater,context:string,f_replace_string:string,m_replace_string:string) => {
  const sOO = JSON.stringify(oO)
  // console.log(`rater: ${rater}; sOO: ${sOO} `)

  const sOO_edited = sOO.replaceAll('\"f\"',f_replace_string).replaceAll('\"m\"',m_replace_string)
  const oO_edited = JSON.parse(sOO_edited)

  if (oO[rater]) {
    oRatingsTable[context][rater] = oO_edited[rater]
    // oRatingsTable[context][rater] = oO[rater]
  }

  return oRatingsTable
}
const returnBrainRecNotBotsRatingsTable = async (parameters: InterpProtocolParams_followsAndMutes) => {
    console.log(`parameters: ${JSON.stringify(parameters, null, 4)}`)
    const aSeedPubkeys:string[] = parameters.pubkeys
    const context = parameters.context
    
    const defaultFollowsScore = parameters.follows.score
    const defaultFollowsConfidence = parameters.follows.confidence
    const defaultMutesScore = parameters.mutes.score
    const defaultMutesConfidence = parameters.mutes.confidence
    // const depth = parameters.depth

    const f_replace_object = { score: defaultFollowsScore, confidence: defaultFollowsConfidence }
    const f_replace_string = JSON.stringify(f_replace_object)
    const m_replace_object = { score: defaultMutesScore, confidence: defaultMutesConfidence }
    const m_replace_string = JSON.stringify(m_replace_object)

    console.log('============ connecting to the db client now')
    const client = await db.connect()
    try {
        /*

        ********** CURRENTLY ASSUMES ONLY ONE SEED USER **********
        
        // TODO: process if there are multiple seedPubkeys

        */
        let oRatingsTable:RatingsV0o = { [context]: {}}

        const pubkey1 = aSeedPubkeys[0]
        const resultSeed_dosSummaries = await client.sql`SELECT * FROM dosSummaries WHERE pubkey=${pubkey1}`;
        const resUsersWithObserverObject = await client.sql`SELECT id, pubkey, observerobject FROM users WHERE whenlastcreatedobserverobject > 0`;




        // ******************************************************
        // smaller ratings table for testing purposes
        let oRatingsTableTruncated:RatingsV0o = { [context]: {}}
        const resultSeed_user = await client.sql`SELECT * FROM users WHERE pubkey=${pubkey1}`;
        let userId_seedUser = 0;

        let oObserverObject_seedUser:RaterObjectV0o = {}
        if (resultSeed_user.rowCount) {
          userId_seedUser = resultSeed_user.rows[0].id
          oObserverObject_seedUser = resultSeed_user.rows[0].observerobject
        }
        oRatingsTableTruncated = addObserverObjectToRatingsTable(oRatingsTableTruncated,oObserverObject_seedUser,userId_seedUser,context,f_replace_string,m_replace_string)
        // ******************************************************



        
        // console.log(`resUsersWithObserverObject.rows: ` + JSON.stringify(resUsersWithObserverObject.rows))
        const observerObjectDataById = arrayToObject(resUsersWithObserverObject.rows, 'id')
        // console.log(`observerObjectDataById: ` + JSON.stringify(observerObjectDataById))

        if (resultSeed_dosSummaries.rowCount) {
          const oLookupIdsByDos = resultSeed_dosSummaries.rows[0].lookupidsbydos
          // console.log(`dos0 number of users: ${oLookupIdsByDos[0].length} `)
          // console.log(`dos1 number of users: ${oLookupIdsByDos[1].length} `)
          
          let continueIterating = true
          let dos = 0
          do {
            const aIds = oLookupIdsByDos[dos];
            // console.log(`----- dos: ${dos}; aIds.length: ${aIds.length}`)
            for (let x=0; x < aIds.length; x++) {
              // if (x < 100000) {
                const nextId = aIds[x]
                if (observerObjectDataById[nextId]) {
                  const observerObject_nextId = observerObjectDataById[nextId].observerobject
                  oRatingsTable = addObserverObjectToRatingsTable(oRatingsTable,observerObject_nextId,nextId,context,f_replace_string,m_replace_string)

                }
                // console.log(`----- x: ${x}; nextId: ${nextId}; observerObjectDataById[x]: ${JSON.stringify(observerObjectDataById[nextId])}`)
                // console.log(`----- x: ${x}; nextId: ${nextId};`)
                // console.log(`----- x: ${x}; nextId: ${nextId}; observerObjectDataById[x]: ${observerObjectDataById[nextId].pubkey}`)
              // }
            }
            
            if (!aIds.length) {
              continueIterating = false
            }
            if (dos == 1) {
              continueIterating = false
            }
            dos++
          } while (continueIterating)
        }

        /*
        // const resultUsersWithObserverObjects = await client.sql`SELECT id, pubkey, observerobject FROM users WHERE whenlastcreatedobserverobject > 0`;
        // TODO: 
        1. iterate through oLookupIdsByDos[0], [1], ... (until length is zero)
        2. for each user, fetch observerObject 
        3. incorporate observerObject into oRatingsTable
        Keep users represented as userID, not as pubkey.
        */

        

        const ratingsWithMetaData:RatingsWithMetaDataV0o = {
          metaData: {
            observer: pubkey1,
            interpretationPrococolUID: "recommendedBrainstormNotBotsInterpretationProtocol"
          },
          // data: oRatingsTableTruncated
          data: oRatingsTable
        }
        const sRatingsWithMetaData = JSON.stringify(ratingsWithMetaData)

        const currentTimestamp = Math.floor(Date.now() / 1000)
        await client.sql`UPDATE ratingsTables SET ratingswithmetadata=${sRatingsWithMetaData}, lastupdated=${currentTimestamp} WHERE pubkey=${pubkey1}`;

        const ratingsTableChars = JSON.stringify(oRatingsTable).length
        const megabyteSize = ratingsTableChars / 1048576
        const message = 'Results of your nostr/requestInterpretation query:'
        const response:ResponseData = {
            success: true,
            message,
            ratingsTableSizeInMegabytes: megabyteSize,
            ratingsWithMetaData: ratingsWithMetaData
        }

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
        console.log('============ releasing the db client now')
    }
}

export default returnBrainRecNotBotsRatingsTable
