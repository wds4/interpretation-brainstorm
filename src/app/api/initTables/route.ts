import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

/*
const sqlCommands = '
CREATE TABLE interpretationProtocols(
  ID INT PRIMARY KEY NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  universalInterpretationProtocolID TEXT NOT NULL, -- used to communicate with the nostr calculation engine; might be the same as the slug
  name TEXT, -- optional
  title TEXT, -- optional
  description TEXT NOT NULL,
  parametersJsonSchema TEXT, -- stringified json that describes the object that holds parameters that must be communicated across the API
  // OPTIONAL: use naddr to point to the jsonSchema in place of the parametersJsonSchema column
  parametersJsonSchemaNaddr TEXT, -- naddr that points to an event in which the json schema is stored (? stringified and placed in content; ? kind)
); '

CREATE TABLE IF NOT EXISTS interpretationProtocols (
  ID SERIAL PRIMARY KEY,
  universalInterpretationProtocolID TEXT NOT NULL,
  name TEXT,
  title TEXT,
  description TEXT,
  parametersJsonSchema JSONB,
  parametersJsonSchemaNaddr TEXT
);

*/

/*
const sFollowsParameters = {
  score: 1.0,
  confidence: 0.05,
  depth: 5,
  pubkeys: [],
  context: notSpam,
}

DROP TABLE interpretationProtocols;

INSERT INTO interpretationProtocols (universalInterpretationProtocolID, parametersJsonSchema) VALUES ('basicFollowsInterpretationProtocol', '{"a": "b"}');
INSERT INTO interpretationProtocols (universalInterpretationProtocolID, parametersJsonSchema) VALUES ('basicFollowsInterpretationProtocol', ${foo});
INSERT INTO interpretationProtocols (universalInterpretationProtocolID) VALUES ("basicFollowsInterpretationProtocol"});
*/

export async function GET(request: Request) {
  const foo = '{"a": "b"}'
  console.log(request)
  try {
    const result = await sql`
INSERT INTO interpretationProtocols (universalInterpretationProtocolID, parametersJsonSchema) VALUES ('basicFollowsInterpretationProtocol', ${foo});
`;
    return NextResponse.json({ result }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}