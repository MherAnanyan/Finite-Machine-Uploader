import React from 'react'

import './style.scss'

interface IProgressBar {
    completed: number
    onCancel: () => void
}

const ProgressBar: React.FC<IProgressBar> = ({ completed, onCancel }) => {
    return (
        <div className="progressBar-area">
            <div
                className="progressBar-filler"
                style={{ width: `${completed}%` }}
            >
                <span className="progressBar-label">{`${completed}%`}</span>
                {completed < 100 && (
                    <button
                        className="delete-btn"
                        type="button"
                        onClick={() => onCancel()}
                    >
                        X
                    </button>
                )}
            </div>
        </div>
    )
}

export default ProgressBar
