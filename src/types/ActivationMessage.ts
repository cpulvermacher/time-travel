export type ActivationMessage = {
    msg: 'active'
    fakeDate: string
    tickStartTimestamp: string | null
    timezone: string | null
    isClockStopped: boolean
}
