import React, { useState, useRef } from 'react'
import { useMachine } from '@xstate/react'
import ProgressBar from '../ProgressBar/Progress'
import FileUploadMachine from '../Machines/UploadMachine'
import { getUrl, uploadFile, IPromiseResponse, markComplete } from '../../api'

import './style.scss'

export const Uploader = () => {
    const fileInput: any = useRef(null)
    const uploadPromise = useRef<IPromiseResponse | null>(null)
    const [progressLineValue, setProgressLineValue] = useState(0)
    const [machineState, sendToStateMachine] = useMachine(FileUploadMachine, {
        actions: {
            uploadFiles: async () => {
                const formData = new FormData()
                const files = fileInput.current?.files
                for (const key of Object.keys(files)) {
                    formData.append('imgCollection', files[key])
                }
                let url = ''
                try {
                    url = await getUrl()
                } catch (e) {
                    sendToStateMachine('FAILED')
                    return
                }
                const onUploadProgress = (progressLineValue: number) => {
                    setProgressLineValue(progressLineValue)
                }
                const response = uploadFile(url, formData, onUploadProgress)
                // @ts-ignore
                uploadPromise.current = response
                try {
                    const dataFromResponse = await response.promise
                    await markComplete(dataFromResponse.data.id)
                    sendToStateMachine('SUCCESS')
                } catch (error) {
                    if (uploadPromise.current) {
                        sendToStateMachine('FAILED')
                        setProgressLineValue(0)
                    }
                }
                uploadPromise.current = null
            },
        },
    })
    const isResetDisabled =
        machineState.value === 'IDLE' || machineState.value === 'UPLOADING'
    const isRetryDisabled =
        machineState.value !== 'CANCELED' && machineState.value !== 'FAILED'
    const isProgressBarShown =
        machineState.value === 'UPLOADING' || machineState.value === 'SUCCESS'

    const onCancel = () => {
        uploadPromise.current?.abort()
        uploadPromise.current = null
        setProgressLineValue(0)
        sendToStateMachine('CANCELED')
    }

    const onReset = () => {
        fileInput.current.value = null
        sendToStateMachine('IDLE')
        setProgressLineValue(0)
    }

    const onRetry = () => {
        sendToStateMachine('UPLOADING')
    }
    return (
        <div className="upload-area-wrapper">
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                }}
            >
                <input
                    style={{ display: 'none' }}
                    id="file"
                    type="file"
                    disabled={machineState.value !== 'IDLE'}
                    ref={fileInput}
                    onChange={() => sendToStateMachine('UPLOADING')}
                    value={fileInput.file}
                    multiple
                    onClick={(e: any) => (e.target.value = null)}
                />

                <label className="upload-btn-wrapper" htmlFor="file">
                    <span
                        className="btn"
                        tabIndex={0}
                        role="button"
                        title={
                            machineState.value !== 'IDLE'
                                ? 'You can reset and Upload again'
                                : ''
                        }
                        aria-controls="filename"
                    >
                        Upload file(s)
                    </span>
                </label>
                <div className="state">
                    <button
                        type="button"
                        onClick={onReset}
                        disabled={isResetDisabled}
                        className={`reset-btn ${
                            isResetDisabled ? 'disabled' : ''
                        } `}
                    >
                        Reset
                    </button>
                    <button
                        type="button"
                        onClick={onRetry}
                        disabled={isResetDisabled}
                        className={`reset-btn ${
                            isRetryDisabled ? 'disabled' : ''
                        } `}
                    >
                        Retry
                    </button>
                    <p>state:{machineState.value}</p>
                </div>
                {isProgressBarShown && (
                    <ProgressBar
                        onCancel={onCancel}
                        completed={progressLineValue}
                    />
                )}
            </form>
        </div>
    )
}
