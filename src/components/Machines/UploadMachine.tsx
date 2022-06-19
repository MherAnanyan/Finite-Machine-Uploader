import { createMachine } from 'xstate'

interface IContext {}
type TMachineEvents =
    | { type: 'IDLE' }
    | { type: 'UPLOADING' }
    | { type: 'SUCCESS' }
    | { type: 'CANCELED' }
    | { type: 'FAILED' }

const FileUploadMachine = createMachine<IContext, TMachineEvents>({
    id: 'file',
    initial: 'IDLE',
    context: {},
    states: {
        IDLE: {
            on: { UPLOADING: 'UPLOADING' },
        },
        UPLOADING: {
            entry: 'uploadFiles',
            on: {
                SUCCESS: 'SUCCESS',
                CANCELED: 'CANCELED',
                FAILED: 'FAILED',
            },
        },
        SUCCESS: {
            on: { IDLE: 'IDLE' },
        },
        FAILED: {
            on: {
                IDLE: 'IDLE',
                UPLOADING: 'UPLOADING',
            },
        },
        CANCELED: {
            on: {
                IDLE: 'IDLE',
                UPLOADING: 'UPLOADING',
            },
        },
    },
})

export default FileUploadMachine
