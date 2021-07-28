import React, { useCallback, useState } from 'react'
import styled from 'styled-components'
import { Field } from './components/Field'

const AppContainer = styled.div`
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`

const InputsForm = styled.form`
  padding-bottom: 20px;
`

function App() {
    const [gridState, setGridState] = useState({
        width: 0,
        height: 0,
        mines: 0,
    })

    const handleFormSubmit = useCallback((e) => {
        e.preventDefault()
        const { width, height, mines } = e.target
        const nextGridState = {
            width: width.value,
            height: height.value,
            mines: mines.value
        }

        if (!nextGridState.mines || nextGridState.mines < 0) {
            alert('Please, place at least 1 mine')
            return
        }

        if (!nextGridState.width || nextGridState.width <= 0) {
            alert('Width is required')
            return
        }

        if (!nextGridState.height || nextGridState.height <= 0) {
            alert('Height is required')
            return
        }

        if (nextGridState.mines > (nextGridState.width * nextGridState.height - 1)) {
            alert('Total mines cannot be greater then width*height')
            return
        }

        setGridState(nextGridState)
    }, [])

    return (
        <AppContainer>
            <InputsForm onSubmit={handleFormSubmit}>
                <input type="number" name={'width'} placeholder={'width'}/>
                <input type="number" name={'height'} placeholder={'height'}/>
                <input type="mines" name={'mines'} placeholder={'mines'}/>
                <button type="submit"> Start </button>
            </InputsForm>
            {
                gridState.width && gridState.height && gridState.mines
                    ? (
                        <Field
                            width={gridState.width}
                            height={gridState.height}
                            totalMines={gridState.mines}
                            overscan={4}
                        />
                    )
                    : null
            }
        </AppContainer>
    )
}

export default App
