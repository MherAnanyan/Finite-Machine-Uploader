import {
    render,
    getByTestId,
    screen,
    waitFor,
    act,
    fireEvent,
} from '@testing-library/react'
import App from './App'
import { markComplete, uploadFile, getUrl } from './api.ts'

jest.mock('./api.ts', () => {
    const originalModule = jest.requireActual('./api.ts')
    return {
        __esModule: true,
        ...originalModule,
        uploadFile: jest.fn(),
        getUrl: jest.fn(),
        markComplete: jest.fn(),
    }
})

const IDMock = '12'
const urlMock = 'url'
const fileMock1 = new File(['(⌐□_□)'], 'someAwesomeStaff.png', {
    type: 'image/png',
})
const fileMock2 = new File(['(⌐□_□)'], 'someAwesomeStaff2.png', {
    type: 'image/png',
})

describe('File upload', () => {
    test('can uploads file successfully and will upload it to service', async () => {
        // making some formData with files we will upload, we will compare them with actual argument
        const formDataMock = new FormData()
        formDataMock.append('imgCollection', fileMock1)
        formDataMock.append('imgCollection', fileMock2)

        uploadFile.mockReturnValueOnce({
            promise: new Promise((resolve) =>
                resolve({ data: { id: IDMock } })
            ),
            abort: jest.fn(),
        })
        getUrl.mockReturnValueOnce(new Promise((resolve) => resolve('url')))
        markComplete.mockReturnValueOnce(new Promise((resolve) => resolve()))

        render(<App />)
        const { getByTestId } = screen
        const currentStateParagraph = getByTestId('current-state')
        const fileUploader = getByTestId('file-upload')
        // initial state is IDLE
        expect(currentStateParagraph).toHaveTextContent('state:IDLE')
        expect(fileUploader).toBeInTheDocument()
        act(() => {
            // adding 2 files, as it should handle multiple files upload
            fireEvent.change(fileUploader, {
                target: { files: [fileMock1, fileMock2] },
            })
        })
        // should get url to upload a file
        await waitFor(() => {
            expect(getUrl).toBeCalledTimes(1)
        })
        // should upload file
        await waitFor(() => {
            expect(uploadFile).toBeCalledTimes(1)
            expect(uploadFile).toBeCalledWith(
                urlMock,
                formDataMock,
                expect.any(Function)
            )
        })
        // should notify api
        await waitFor(() => {
            expect(markComplete).toBeCalledTimes(1)
            expect(markComplete).toBeCalledWith(IDMock)
        })
        expect(currentStateParagraph).toHaveTextContent('state:SUCCESS')
    })
    test('user should be able to retry', async () => {
        uploadFile.mockReturnValueOnce({
            promise: new Promise((_, reject) =>
                reject()
            ),
            abort: jest.fn(),
        })
        render(<App />)
        const { getByTestId } = screen
        const currentStateParagraph = getByTestId('current-state')
        const fileUploader = getByTestId('file-upload')
        const retryButton = screen.getByRole('button', { name: /retry/i })
        expect(fileUploader).toBeInTheDocument()
        expect(retryButton).toBeDisabled()
        act(() => {
            fireEvent.change(fileUploader, {
                target: { files: [fileMock1] },
            })
        })
        await waitFor(() => {
            expect(uploadFile).toBeCalledTimes(1)
        })
        expect(currentStateParagraph).toHaveTextContent('state:FAILED')
        expect(retryButton).not.toBeDisabled()
        fireEvent.click(retryButton)
        await waitFor(() => {
            expect(uploadFile).toBeCalledTimes(2)
        })
    })
})
