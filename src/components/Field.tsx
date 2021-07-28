import React from 'react'
import { FixedSizeGrid as Grid, GridChildComponentProps } from 'react-window'
import { MinesController } from '../MinesController'
import { Cell } from './Cell'

interface IFieldProps {
    width: number
    height: number
    overscan: number
    totalMines: number
}

export const Field: React.FC<IFieldProps> = (props) => {
    const { width, height, totalMines, overscan } = props

    const minesController = new MinesController(
        { width, height },
        new Uint8Array(new ArrayBuffer(width * height)),
        totalMines,
        overscan,
    )

    return (
        <Grid
            overscanColumnCount={overscan}
            overscanRowCount={overscan}
            columnCount={width}
            rowCount={height}
            columnWidth={40}
            rowHeight={40}
            height={700}
            width={700}
            onItemsRendered={minesController.updateVisibleGridCellsState}
            onScroll={minesController.handleScroll}
        >
            {
                (props: GridChildComponentProps) => {
                    const {style, columnIndex, rowIndex} = props

                    return (
                        <div style={style}>
                            <Cell
                                x={columnIndex}
                                y={rowIndex}
                                width={700}
                                height={700}
                                minesController={minesController}
                            />
                        </div>
                    )
                }
            }
        </Grid>
    )
}
