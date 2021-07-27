import { observer } from 'mobx-react'
import React from 'react'
import styled from 'styled-components'
import { CellState, MinesController } from '../MinesContex'

interface ICellWrapper {
    state: number
}

const CellWrapper = styled.div<ICellWrapper>`
  width: 40px;
  height: 40px;
  cursor: pointer;
  border: 1px solid black;
  ${({ state }) => {
    if (state === CellState.EMPTY || state === CellState.VISITED_BY_MINES_BUFFER || state === CellState.HAS_MINE) {
      return `background-color: grey;`;
    } else if (state > 0 && state < 9 || state === CellState.ZERO_MINES || state === CellState.FILLED) {
      return "background-color: white"
    }
  }}
`

interface ICellProps {
    minesController: MinesController
    x: number
    y: number
    width:number
    height:number
}

export const Cell: React.FC<ICellProps> = observer((props) => {
    const { minesController } = props

    const cellState = minesController.getCellState(props.x,props.y)
    let cellText:string | null = ''

    if (cellState > 0 && cellState < 9) {
        cellText = String(cellState)
    } else if (cellState === CellState.VISITED_BY_MINES_BUFFER || cellState === CellState.EMPTY || cellState === CellState.ZERO_MINES || cellState === CellState.FILLED) {
        cellText = null
    }

    return (
        <CellWrapper
            data-x={props.x}
            data-y={props.y}
            state={cellState}
            onClick={minesController.handleCellClick}
        >
            {cellText}
        </CellWrapper>
    )
})
