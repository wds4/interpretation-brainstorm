import returnBrainRecNotBotsRatingsTable, { RatingsTableObject } from "./returnBrainRecNotBotsRatingsTable";
import returnFollowsOnlyRatingsTable from "./returnFollowsOnlyRatingsTable";
import returnMutesOnlyRatingsTable from "./returnMutesOnlyRatingsTable";

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

const processRequest = async (request: string) => {
    // VALIDATION STEP 1: Validate the request object
    const valid = validateRequest(request) // see below
    if (!valid) {
      return errorInvalidRequest() // option: incorporate validate.errors into the response
    }
  
    const oRequest = JSON.parse(request)
  
    const universalInterpretationProtocolID = oRequest.universalInterpretationProtocolID
    const parameters = universalInterpretationProtocolID.parameters
  
     // VALIDATION STEP 2. make sure universalInterpretationProtocolID is recognized; if not, return an error
     if (!aSupportedProtocols.includes(universalInterpretationProtocolID)) {
      return errorInterpretationProtocolNotRecognized()
    }
  
    // let aRatings = [ ['string', 'string', 'string',  1.0, 0.05] ] // need to define type
    let oRatingsTable: RatingsTableObject = { 'notSpam': {}}
  
    switch(universalInterpretationProtocolID) {
      case "basicBrainstormFollowsOnlyInterpretationProtocol":
        oRatingsTable = await returnFollowsOnlyRatingsTable(parameters)
        break
      case "basicdBrainstormMutesOnlyInterpretationProtocol":
        oRatingsTable = await returnMutesOnlyRatingsTable(parameters)
        break
      case "recommendedBrainstormNotBotsInterpretationProtocol": // follows, mutes, and reports (may add zaps, other sources of data later)
        oRatingsTable = await returnBrainRecNotBotsRatingsTable(parameters)
        break
      default:
        return errorInterpretationProtocolNotRecognized() // may be moving this error to before the switch
    }
  
    const response = {
      success: true,
      ratingsTable: oRatingsTable
    }
    return response
}

export default processRequest
