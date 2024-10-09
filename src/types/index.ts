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

// interp protocol parameters
type Foo = {
    score: number,
    confidence: number
}
export interface InterpProtocolParams_follows {
    follows: Foo
}
export interface InterpProtocolParams_mutes {
    mutes: Foo
}
export interface InterpProtocolParams_followsAndMutes {
    context: string,
    pubkeys: string[],
    depth: number,
    follows: Foo,
    mutes: Foo
}