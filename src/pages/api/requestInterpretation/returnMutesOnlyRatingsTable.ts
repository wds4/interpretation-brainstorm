import { RatingsTableObject } from "@/types"
import { ResponseData } from "./processRequest"

const oRatingsTable:RatingsTableObject = { 'notSpam': {}}

const returnMutesOnlyRatingsTable = async (params: object) => {
    console.log(params)
    oRatingsTable.notSpam = {
        'Alice': {
            'Charlie': [0.0, 0.1]
        }
    }

    const response:ResponseData = {
        success: true,
        ratingsTable: oRatingsTable
    }

    return response
}

export default returnMutesOnlyRatingsTable