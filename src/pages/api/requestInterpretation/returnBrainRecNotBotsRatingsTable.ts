type context = string
type pubkey = string
type miniRating = number[]
type R1 = {
    [key: pubkey]: miniRating
  }
type R2 = {
    [key: pubkey]: R1
}
export type RatingsTableObject = {
    [key: context]: R2
}

const oRatingsTable:RatingsTableObject = { 'notSpam': {}}

const returnBrainRecNotBotsRatingsTable = async (params: string) => {
    console.log(params)
    oRatingsTable.notSpam = {
        'Alice': {
            'Bob': [1.0, 0.05],
            'Charlie': [0.0, 0.1]
        }
    }
    return oRatingsTable
}

export default returnBrainRecNotBotsRatingsTable