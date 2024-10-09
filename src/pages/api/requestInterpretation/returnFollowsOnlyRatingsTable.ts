import { RatingsTableObject } from "@/types"
import { ResponseData } from "./processRequest"

const oRatingsTable:RatingsTableObject = { 'notSpam': {}}

const returnFollowsOnlyRatingsTable = async (params: object) => {
    console.log(params)
    oRatingsTable.notSpam = {
        'Alice': {
            'Bob': [1.0, 0.05]
        }
    }

    const response:ResponseData = {
        success: true,
        ratingsTable: oRatingsTable
    }

    return response
}

export default returnFollowsOnlyRatingsTable