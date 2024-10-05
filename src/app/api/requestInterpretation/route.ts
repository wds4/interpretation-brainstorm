import { db } from "@vercel/postgres";
import { NextResponse } from "next/server";

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

  let aRatings = [ ['string', 0.1] ] // need to define type

  switch(universalInterpretationProtocolID) {
    case "basicBrainstormFollowsOnlyInterpretationProtocol":
      aRatings = await returnFollowsOnlyTable(parameters)
      break
    case "basicdBrainstormMutesOnlyInterpretationProtocol":
      aRatings = await returnMutesOnlyTable(parameters)
      break
    case "recommendedBrainstormNotBotsInterpretationProtocol": // follows, mutes, and reports (may add zaps, other sources of data later)
      aRatings = await returnNotBotsTable(parameters)
      break
    default:
      return errorInterpretationProtocolNotRecognized() // may be moving this error to before the switch
  }

  const response = {
    success: true,
    ratingsTable: aRatings
  }
  return response
  // return JSON.stringify(response)

  // return universalInterpretationProtocolID
}

const returnFollowsOnlyTable = async (params) => {
  console.log(params)
  const aRatings = []
  /* build the aRatings table from follows */
  const r1 = ['Alice', 'Bob', 'notSpam', 1.0, 0.05]
  aRatings.push(r1)
  return aRatings;
} 

const returnMutesOnlyTable = async (params) => {
  console.log(params)
  const aRatings = []
  /* build the aRatings table from mutes */
  const r2 = ['Alice', 'Charlie', 'notSpam', 0.0, 0.1]
  aRatings.push(r2)
  return aRatings;
} 

const returnNotBotsTable = async (params) => {
  console.log(params)
  const aRatings = []
  /* build the aRatings table from follows and mutes */
  const r1 = ['Alice', 'Bob', 'notSpam', 1.0, 0.05]
  aRatings.push(r1)
  const r2 = ['Alice', 'Charlie', 'notSpam', 0.0, 0.1]
  aRatings.push(r2)
  return aRatings;
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const req = searchParams.get("req");
  const client = await db.connect();
  try {
    let response = 'error response'
    if (typeof req == 'string') {
      response = await processRequest(req)
    }
    // return NextResponse.json({ result }, { status: 200 });
    return NextResponse.json( response, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  } finally {
    client.release();
  }
}

const errorInvalidRequest = () => {
  const response = { success: false, message: "The request object does not validate." }
  return response;
}

const errorInterpretationProtocolNotRecognized = () => {
  const response = { success: false, message: "universalInterpretationProtocolID not recognized." }
  return response;
}
