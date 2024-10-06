import { nip19 } from 'nostr-tools'

export function verifyPubkeyValidity(str:string) {
    try {
        const npub = nip19.npubEncode(str)
        if (npub) {
            return true
        }
        return false
    } catch (e) {
        console.log(e)
        return false
    }
}