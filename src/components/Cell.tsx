import { observer } from 'mobx-react'
import React, { useCallback } from 'react'
import styled from 'styled-components'
import { CellState, MinesController } from '../MinesController'

interface ICellWrapper {
    state: number
}

const CellWrapper = styled.div<ICellWrapper>`
  width: 40px;
  height: 40px;
  cursor: pointer;
  border: 1px solid black;
  line-height: 40px;
  text-align: center;
  
  ${({ state }) => {
    if (state === CellState.EMPTY || state === CellState.VISITED_BY_MINES_BUFFER || state === CellState.HAS_MINE) {
      return `background-color: grey;`;
    } else if (state > 0 && state < 9 || state === CellState.ZERO_MINES) {
      return "background-color: white"
    } else if (state > 11) {
      return "background-color: green"
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
    const handleClick = useCallback(() => {
        return minesController.handleCellClick(props.x, props.y)
    }, [props.x, props.y])

    const handleContextMenu = useCallback((e) => {
        e.preventDefault()
        return minesController.markMine(props.x, props.y)
    }, [props.x, props.y])

    const { minesController } = props

    const cellState = minesController.getCellState(props.x,props.y)
    let cellText:string | null = ''

    if (cellState > 0 && cellState < 9) {
        cellText = String(cellState)
    }

    return (
        <CellWrapper
            state={cellState}
            onClick={handleClick}
            onContextMenu={handleContextMenu}
        >
            {cellText}
        </CellWrapper>
    )
})

