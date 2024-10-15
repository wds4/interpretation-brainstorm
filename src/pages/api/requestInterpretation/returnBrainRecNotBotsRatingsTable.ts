import { InterpProtocolParams_followsAndMutes, RatingsTableObject } from "@/types"
import { db } from "@vercel/postgres";
import { ResponseData } from "./processRequest";

const returnBrainRecNotBotsRatingsTable = async (parameters: InterpProtocolParams_followsAndMutes) => {
    console.log(`parameters: ${JSON.stringify(parameters, null, 4)}`)
    const aSeedPubkeys:string[] = parameters.pubkeys
    const context = parameters.context
    /*
    const defaultFollowsScore = parameters.follows.score
    const defaultFollowsConfidence = parameters.follows.confidence
    const defaultMutesScore = parameters.mutes.score
    const defaultMutesConfidence = parameters.mutes.confidence
    const depth = parameters.depth
    */
    const oRatingsTable:RatingsTableObject = { [context]: {}}

    console.log('============ connecting to the db client now')
    const client = await db.connect()
    try {
        /*

        ********** CURRENTLY ASSUMES ONLY ONE SEED USER **********
        
        // TODO: process if there are multiple seedPubkeys

        */
        
        const pubkey1 = aSeedPubkeys[0]
        const resultMeDosSummaries = await client.sql`SELECT * FROM dosSummaries WHERE pubkey=${pubkey1}`;
        if (resultMeDosSummaries.rowCount) {
          const oLookupIdsByDos = resultMeDosSummaries.rows[0].lookupidsbydos
          console.log(`dos0 number of users: ${oLookupIdsByDos[0].length} `)
          console.log(`dos1 number of users: ${oLookupIdsByDos[1].length} `)
        }
        /*
        // const resultUsersWithObserverObjects = await client.sql`SELECT id, pubkey, observerobject FROM users WHERE whenlastcreatedobserverobject > 0`;
        // TODO: 
        1. iterate through oLookupIdsByDos[0], [1], ... (until length is zero)
        2. for each user, fetch observerObject 
        3. incorporate observerObject into oRatingsTable
        Keep users represented as userID, not as pubkey.
        */







        const message = 'Results of your nostr/requestInterpretation query:'
        const response:ResponseData = {
            success: true,
            message,
            ratingsTable: oRatingsTable
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
