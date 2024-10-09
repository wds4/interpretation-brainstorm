export const schema_basicBrainstormFollowsOnlyInterpretationProtocol = {
    type: "object",
    properties: {
      follows: {
        type: 'object',
        required: ['score','confidence'],
        properties: {
          score: {
            type: 'number',
            minimum: 0.0,
            maximum: 1.0
          },
          confidence: {
            type: 'number',
            minimum: 0.0,
            maximum: 1.0
          }
        }
      }
    },
    required: ['follows']
  }

  export const schema_basicBrainstormMutesOnlyInterpretationProtocol = {
    type: "object",
    properties: {
      mutes: {
        type: 'object',
        required: ['score','confidence'],
        properties: {
          score: {
            type: 'number',
            minimum: 0.0,
            maximum: 1.0
          },
          confidence: {
            type: 'number',
            minimum: 0.0,
            maximum: 1.0
          }
        }
      }
    },
    required: ['mutes']
  }

  export const schema_recommendedBrainstormNotBotsInterpretationProtocol = {
    type: "object",
    properties: {
      context: {
        type: 'string'
      },
      pubkeys: {
        type: 'array',
        items: {
          type: 'string'
        }
      },
      depth: {
        type: 'integer',
        minimum: 0
      },
      follows: {
        type: 'object',
        required: ['score','confidence'],
        properties: {
          score: {
            type: 'number',
            minimum: 0.0,
            maximum: 1.0
          },
          confidence: {
            type: 'number',
            minimum: 0.0,
            maximum: 1.0
          }
        }
      },
      mutes: {
        type: 'object',
        required: ['score','confidence'],
        properties: {
          score: {
            type: 'number',
            minimum: 0.0,
            maximum: 1.0
          },
          confidence: {
            type: 'number',
            minimum: 0.0,
            maximum: 1.0
          }
        }
      }
    },
    required: ['context', 'pubkeys', 'depth', 'follows', 'mutes']
  }