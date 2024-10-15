import { InterpProtocolParams_follows, InterpProtocolParams_followsAndMutes, InterpProtocolParams_mutes, RatingsTableObject } from "@/types";
import returnBrainRecNotBotsRatingsTable from "./returnBrainRecNotBotsRatingsTable"
import returnFollowsOnlyRatingsTable from "./returnFollowsOnlyRatingsTable";
import returnMutesOnlyRatingsTable from "./returnMutesOnlyRatingsTable";
import Ajv from "ajv"
import { schema_basicBrainstormFollowsOnlyInterpretationProtocol, schema_basicBrainstormMutesOnlyInterpretationProtocol, schema_recommendedBrainstormNotBotsInterpretationProtocol } from "@/jsonSchemas";
import { RatingsV0o, RatingsWithMetaDataV0o } from "@/typesUpdated";
const ajv = new Ajv()

const validate_basicBrainstormFollowsOnlyInterpretationProtocol = ajv.compile(schema_basicBrainstormFollowsOnlyInterpretationProtocol)
const validate_basicBrainstormMutesOnlyInterpretationProtocol = ajv.compile(schema_basicBrainstormMutesOnlyInterpretationProtocol)
const validate_recommendedBrainstormNotBotsInterpretationProtocol = ajv.compile(schema_recommendedBrainstormNotBotsInterpretationProtocol)

const errorInvalidRequest = () => {
    const response = { success: false, message: "The request object does not validate." }
    return response;
}
  
const errorInterpretationProtocolNotRecognized = () => {
    const response = { success: false, message: "universalInterpretationProtocolID not recognized." }
    return response;
}
  
const aSupportedProtocols = [
    "basicBrainstormFollowsOnlyInterpretationProtocol",
    "basicdBrainstormMutesOnlyInterpretationProtocol",
    "basicBrainstormReportsOnlyInterpretationProtocol",
    "expandedBrainstormReportsOnlyInterpretationProtocol",
    "recommendedBrainstormNotBotsInterpretationProtocol",
]
  
const validateRequest = (request: string) => {
    try {
        const oRequest = JSON.parse(request)
        if (oRequest.universalInterpretationProtocolID && oRequest.parameters) {
          return true
        }
    } catch (e) {
      console.log(e)
      return false
    }
    return false
}

export type ResponseData = {
  success: boolean,
  message?: string,
  ratingsTableSizeInMegabytes?: number,
  ratingsWithMetaData?: RatingsWithMetaDataV0o,
  validationErrors?: object,
  error?: object
  dosData?: object,
  ratingsTable?: RatingsTableObject | RatingsV0o // converting this from RatingsTableObject to RatingsV0o
}

const processRequest = async (request: string) => {
    // VALIDATION STEP 1: Validate the request object
    const valid = validateRequest(request) // see below
    if (!valid) {
      return errorInvalidRequest() // option: incorporate validate.errors into the response
    }
  
    const oRequest = JSON.parse(request)
  
    const universalInterpretationProtocolID = oRequest.universalInterpretationProtocolID
  
    // VALIDATION STEP 2. make sure universalInterpretationProtocolID is recognized; if not, return an error
    if (!aSupportedProtocols.includes(universalInterpretationProtocolID)) {
      return errorInterpretationProtocolNotRecognized()
    }
  
    const oRatingsTable: RatingsTableObject = { 'notSpam': {}}

    let response:ResponseData = {
      success: true,
      ratingsTable: oRatingsTable
    }
    switch(universalInterpretationProtocolID) {
      case "basicBrainstormFollowsOnlyInterpretationProtocol":
        const oInterpretationParameters_follows:InterpProtocolParams_follows = oRequest.parameters
        if (validate_basicBrainstormFollowsOnlyInterpretationProtocol(oInterpretationParameters_follows)) {
          response = await returnFollowsOnlyRatingsTable(oInterpretationParameters_follows)
        } else {
          response.success = false
          console.log(validate_basicBrainstormFollowsOnlyInterpretationProtocol.errors)
        }
        break
      case "basicBrainstormMutesOnlyInterpretationProtocol":
        const oInterpretationParameters_mutes:InterpProtocolParams_mutes = oRequest.parameters
        if (validate_basicBrainstormMutesOnlyInterpretationProtocol(oInterpretationParameters_mutes)) {
          response = await returnMutesOnlyRatingsTable(oInterpretationParameters_mutes)
        } else {
          response.success = false
          console.log(validate_basicBrainstormMutesOnlyInterpretationProtocol.errors)
        }
        break
      case "recommendedBrainstormNotBotsInterpretationProtocol": // follows, mutes, and reports (may add zaps, other sources of data later)
        const oInterpretationParameters_followsAndMutes:InterpProtocolParams_followsAndMutes = oRequest.parameters
        if (validate_recommendedBrainstormNotBotsInterpretationProtocol(oInterpretationParameters_followsAndMutes)) {
          response = await returnBrainRecNotBotsRatingsTable(oInterpretationParameters_followsAndMutes)
        } else {
          response.success = false
          response.message = 'parameters did not validate'
          if (typeof validate_recommendedBrainstormNotBotsInterpretationProtocol.errors == 'object') {
            response.validationErrors = JSON.parse(JSON.stringify(validate_recommendedBrainstormNotBotsInterpretationProtocol.errors))
          }
          console.log(validate_recommendedBrainstormNotBotsInterpretationProtocol.errors)
        }
        break
      default:
        return errorInterpretationProtocolNotRecognized() // may be moving this error to before the switch
    }
    return response
}

export default processRequest
