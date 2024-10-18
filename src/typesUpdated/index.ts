/*
Main goal here is to define types for this equation:
G_out = coreGrapeRankCalculator(G_in, R, P)

G_out:ScorecardsWithMetaDataV3
G_in:ScorecardsV3
R:Ratings
P:GrapeRankParameters

Or maybe use ScorecardsV3 for G_in, but ScorecardsWithMetaDataV3 wrappers (which include metadata) for G_out?
*/

type context = string
type pubkey = string
type score = number // can refer to a rating as a primary data point or to an average of ratings, so may be referred to as rating, average, or averageScore. min, max depend on the use case (0-1 for notSpam; 0-5 for 5stars or products; may be negative in some use cases). 
type input = number // nonzero, no upper bound
type confidence = number // [0, 1]; can be de novo (rating) or calculated from input (scorecard)
type influence = number // score * confidence; useful if observee can play the role of a rater or observer at a future step; may be defined differently for other use cases (e.g. 5 star ratings)
type weights = number // sum of weights; used as running score during calculations
type products = number // sum of products

type aScoreAndConfidence = [score, confidence]
export type oScoreAndConfidence = { score: score, confidence: confidence }
type aScoreAndInput = [score, input]
type aInfluenceScoreConfidenceInput = [influence, score, confidence, input]
export type oExpandedScoreParameters = { influence: influence, score: score, confidence: confidence, input: input, weights: weights, products: products }

export const oInitializedScores:oExpandedScoreParameters = {
    influence: 0,
    score: 0,
    confidence: 0,
    input: 0,
    weights: 0,
    products: 0
}

export type rater = pubkey | number
export type ratee = pubkey | number
export type observer = pubkey | number
export type observee = pubkey | number

/*
for ratings and for scorecards:
V0: aScoreAndConfidence
V0Compact: string
V0o: oScoreAndConfidence
*/

// Ratings Version0: aScoreAndConfidence

type RateeObjectV0 = {
    [key: ratee]: aScoreAndConfidence
  }
export type RaterObjectV0 = {
    [key: rater]: RateeObjectV0
}
export type RatingsV0 = {
    [key: context]: RaterObjectV0
}

export const exampleRatingsV0:RatingsV0 = {
    notSpam: {
        alice: {
            bob: [1.0, 0.05],
            charlie: [1.0, 0.05],
            zed: [0.0, 0.1]
        },
        bob: {
            charlie: [1.0, 0.05],
            zed: [0.0, 0.1] 
        },
        zed: {
            zed: [1.0, 0.05]
        }
    }
}

// Ratings Version0o, object: oScoreAndConfidence

type RateeObjectV0o = {
    [key: ratee]: oScoreAndConfidence
}

type RateeObjectCV0o = { // C = compactFormat; Alice: 'f' instead of Alice: { score: 1.0, confidence: 0.05 }
    [key: ratee]: string
}

export type RaterObjectV0o = {
    [key: rater]: RateeObjectV0o
}
export type RaterObjectCV0o = {
    [key: rater]: RateeObjectCV0o
}

export type RatingsV0o = {
    [key: context]: RaterObjectV0o
}
export type RatingsCV0o = {
    [key: context]: RaterObjectCV0o
}

export const exampleRatingsV0o:RatingsV0o = {
    notSpam: {
        1: {
            alice: { score: 1.0, confidence: 0.05},
        },
        alice: {
            bob: { score: 1.0, confidence: 0.05},
            charlie: { score: 1.0, confidence: 0.05},
            4: { score: 1.0, confidence: 0.05},
            zed: { score: 0.0, confidence: 0.1},
        },
        bob: {
            charlie: { score: 1.0, confidence: 0.05},
            zed: { score: 0.0, confidence: 0.1},
        },
        zed: {
            zed: { score: 1.0, confidence: 0.05},
        },
        4: {
            3: { score: 1.0, confidence: 0.05},
            5: { score: 0.0, confidence: 0.1},
        },
    }
}

export const exampleRatingsCV0o:RatingsCV0o = {
    notSpam: {
        1: {
            alice: 'f',
        },
        alice: {
            bob: 'f',
            charlie: 'f',
            4: 'f',
            zed: 'm',
        },
        bob: {
            charlie: 'f',
            zed: 'm',
        },
        zed: {
            zed: 'f',
        },
        4: {
            3: 'f',
            5: 'm',
        },
    }
}

// R: Ratings

export type RateeObject = RateeObjectV0 | RateeObjectV0o
export type RaterObject = RaterObjectV0 | RaterObjectV0o
export type Ratings = RaterObjectV0 | RaterObjectV0o

// G: Scorecards 
/*
Multiple versions, depending on which numbers are reported
ScorecardsV0 "aScoreAndConfidence" -- 
ScorecardsV1 "aScoreAndInput" -- alternate to V0
ScorecardsV2 "aInfluenceScoreConfidenceInput" -- includes all 4 numbers which is better for running calculations but maybe bad for long term storage
ScorecardsV3 "oExpandedScoreParameters" -- bigger footprint but easier to write code
ScorecardsV4 "oInfluence" -- smallest footprint

Comparisons:
V0 versus V1: input is cleaner but confidence is easier to use (since influence = score * confidence)

long term storage: 
- V0 is a good choice; in a wrapper that may include rigor as metaData which tells us how confidence was calculated
    Why? bc it reduces filesize compared to others
- VC0 idea for further data compaction: encode pubkeys with id numbers in metaData; then replace pubkeys with id numbers

running calculation using the core grapeRankCalculator:
- V3 is probably what should be used internally and returned
    Why? easiest way to write code without getting parameters mixed up
- V0, V1, V2, V3, or any other reasonable formats should be acceptable as input into the calculator
    type should be ascertained and should be converted to V3 at the start

functions written to convert from one type to another
*/

// Scorecards Version 0: aScoreAndConfidence (SAME AS RATINGS TABLE)
type ObserveeObjectV0 = {
    [key: observee]: aScoreAndConfidence
}
export type ObserverObjectV0 = {
    [key: observer]: ObserveeObjectV0
}
export type ScorecardsV0 = {
    [key: context]: ObserverObjectV0
}

// Most compact format, using two strategies:
// use ids instead of pubkeys (where available)
type ObserveeObjectV0Compact = {
    [key: observee]: string
}
export type ObserverObjectV0Compact = {
    [key: observer]: ObserveeObjectV0Compact
}

export const observerObjectExample:ObserverObjectV0Compact = {
    1: {
        2: 'f',
        3: 'f',
        99: 'm'
    },
    2: {
        'pubkey123abc': 'm'
    },
    3: {
        1: 'f',
        99: 'm'
    },
    'pubkey123abc': {
        99: 'f'
    }
}

// RatingsOrScorecardsJointObject
// Since Ratings and ScorecardsV0 should be interchangeable, define one that can be either-or
type EeObject = {
    [key: ratee | observee]: aScoreAndConfidence
  }
type ErObject = {
    [key: rater | observer]: EeObject
}
export type RatingsOrScorecardsJointObject = {
    [key: context]: ErObject
}

export const exampleScorecardsV0:ScorecardsV0 = {
    notSpam: {
        alice: {
            bob: [1.0, 0.05],
            charlie: [1.0, 0.05],
            zed: [0.0, 0.1]
        },
        bob: {
            charlie: [1.0, 0.05],
            zed: [0.0, 0.1] 
        },
        zed: {
            zed: [1.0, 0.05]
        }
    }
}

// Scorecards Version 1: aScoreAndInput
type ObserveeObjectV1 = {
    [key: pubkey]: aScoreAndInput
  }
type ObserverObjectV1 = {
    [key: pubkey]: ObserveeObjectV1
}
export type ScorecardsV1 = {
    [key: context]: ObserverObjectV1
}
export const exampleScorecardsV1:ScorecardsV1 = {
    notSpam: {
        alice: {
            bob: [1.0, 0.05],
            charlie: [1.0, 0.05],
            zed: [0.0, 0.1]
        },
        bob: {
            charlie: [1.0, 0.05],
            zed: [0.0, 0.1] 
        },
        zed: {
            zed: [1.0, 0.05]
        }
    }
}

// Scorecards Version 2: aInfluenceScoreConfidenceInput
type ObserveeObjectV2 = {
    [key: pubkey]: aInfluenceScoreConfidenceInput
  }
type ObserverObjectV2 = {
    [key: pubkey]: ObserveeObjectV2
}
export type ScorecardsV2 = {
    [key: context]: ObserverObjectV2
}
export const exampleScorecardsV2:ScorecardsV2 = {
    notSpam: {
        alice: {
            bob: [0.5, 1.0, 0.5, 0.05],
            charlie: [0.5, 1.0, 0.5, 0.05],
            zed: [0.0, 0.0, 0.75, 0.1]
        },
        bob: {
            charlie: [0.5, 1.0, 0.5, 0.05],
            zed: [0.0, 0.0, 0.75, 0.1] 
        },
        zed: {
            zed: [0.5, 1.0, 0.5, 0.05]
        }
    }
}

// Scorecards Version 3: oExpandedScoreParameters
export type ObserveeObjectV3 = {
    [key: observee]: oExpandedScoreParameters
}
export type ObserverObjectV3 = {
    [key: observer]: ObserveeObjectV3
}
export type ScorecardsV3 = {
    [key: context]: ObserverObjectV3
}
export const exampleScorecardsV3:ScorecardsV3 = {
    notSpam: {
        alice: {
            bob: {
                influence: 0.5, 
                score: 1.0, 
                confidence: 0.5,
                input: 0.05,
                weights: 0,
                products: 0
            }
        },
        bob: {
            charlie: {
                influence: 0.5, 
                score: 1.0, 
                confidence: 0.5,
                input: 0.05,
                weights: 0,
                products: 0
            }
        }
    }
}

// Scorecards and Ratings Wrappers

export type ScorecardsMetaData = {
    observer: observer, // the "owner" of the scorecardTable
    grapeRankProtocolUID?: string,
    rigor?: number
}

export type RatingsMetaData = {
    observer: observer // the "owner" of the Ratings (i.e. the person who commissioned its creation?)
    interpretationPrococolUID?: string
    compactFormat?: boolean
    replacements: {[key: string]: oScoreAndConfidence}
}

export type ScorecardsWithMetaDataV3 = {
    success: boolean
    message?: string
    metaData: object
    data: ScorecardsV3
}

export type RatingsWithMetaData = {
    metaData: RatingsMetaData
    data: Ratings
}

export type RatingsWithMetaDataV0o = {
    metaData: RatingsMetaData
    data: RatingsV0o
}

export type RatingsWithMetaDataCV0o = {
    metaData: RatingsMetaData
    data: RatingsCV0o
}

export const exampleRatingsWithMetaDataCV0o:RatingsWithMetaDataCV0o = {
    metaData: {
        observer: 'Alice',
        interpretationPrococolUID: 'recommendedBrainstormNotBotsInterpretationProtocol',
        compactFormat: true,
        replacements: {
            f: {"score":1,"confidence":0.05},
            m: {"score":0,"confidence":0.1}
        }
    },
    data: exampleRatingsCV0o
}

// GrapeRank protocol parameters
export type GrapeRankParametersBasicNetwork = {
    observer: observer,
    context: string,
    seedUsers: pubkey[],
    rigor: number,
    attenuation: number,
    defaults: {
        score: number,
        confidence: number
    }
}
export type GrapeRankParameters5Star = {
    observer: observer,
    context: string,
    rigor: number,
    defaults: {
        score: number,
        confidence: number
    }
}

// type GrapeRankParameters = GrapeRankParametersBasicNetwork | GrapeRankParameters5Star

export type GrapeRankParametersWithMetaData = {
    metaData: {
        grapeRankProtocolUID: string
        compactFormat?: boolean
    },
    data: GrapeRankParametersBasicNetwork
}

export const defaultGrapeRankNotSpamParameters:GrapeRankParametersBasicNetwork = {
    observer: 'e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f',
    context: 'notSpam',
    seedUsers: ['alice'],
    rigor: 0.25,
    attenuation: 0.8,
    defaults: {
        score: 0,
        confidence: 0.1
    }
}

export const defaultGrapeRankNotSpamParametersWithMedaData:GrapeRankParametersWithMetaData = {
    metaData: {
        grapeRankProtocolUID: 'basicGrapevineNetwork'
    },
    data: defaultGrapeRankNotSpamParameters
}

// interpretation protocol parameters
type FollowsParameters = {
    score: number,
    confidence: number
}
type MutesParameters = {
    score: number,
    confidence: number
}
type ReportsParameters = {
    score: number,
    confidence: number,
    reportTypes: string[]
}
export interface InterpProtocolParams_follows {
    context: string,
    pubkeys: string[],
    depth: number,
    follows: FollowsParameters
}
export interface InterpProtocolParams_mutes {
    context: string,
    pubkeys: string[],
    depth: number,
    mutes: MutesParameters
}
export interface InterpProtocolParams_reports {
    context: string,
    pubkeys: string[],
    depth: number,
    reports: ReportsParameters
}
export interface InterpProtocolParams_followsAndMutes {
    context: string,
    pubkeys: string[],
    depth: number,
    follows: FollowsParameters,
    mutes: MutesParameters
}