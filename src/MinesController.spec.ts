import { CellState, MARKED_MINE_SHIFT, MinesController } from './MinesController'

describe('MinesController', () => {
    it('Should correctly place the mines', () => {
        const minesBuffer = new Uint8Array( new ArrayBuffer(100) )

        const totalMines = 1
        const minesController = new MinesController(
            { width: 10, height: 10 },
            minesBuffer,
            totalMines,
            0
        )

        minesController.updateVisibleGridCellsState({
            overscanColumnStartIndex: 0,
            overscanColumnStopIndex: 10,
            overscanRowStartIndex: 0,
            overscanRowStopIndex: 10,
            visibleColumnStartIndex: 0,
            visibleColumnStopIndex: 10,
            visibleRowStartIndex: 0,
            visibleRowStopIndex: 10,
        })


        let placedMinesCount = 0

        for (let i = 0; i < minesBuffer.length; i++) {
            if (minesBuffer[i] === CellState.HAS_MINE) {
                placedMinesCount += 1
            }
        }

        expect(placedMinesCount).toEqual(totalMines)
    })

    it('should correctly mark the cell', () => {
        const minesBuffer = new Uint8Array( new ArrayBuffer(100) )

        const totalMines = 0
        const minesController = new MinesController(
            { width: 10, height: 10 },
            minesBuffer,
            totalMines,
            0
        )

        minesController.updateVisibleGridCellsState({
            overscanColumnStartIndex: 0,
            overscanColumnStopIndex: 10,
            overscanRowStartIndex: 0,
            overscanRowStopIndex: 10,
            visibleColumnStartIndex: 0,
            visibleColumnStopIndex: 10,
            visibleRowStartIndex: 0,
            visibleRowStopIndex: 10,
        })

        minesController.markMine(0,0)

        expect(minesBuffer[0]).toEqual(CellState.VISITED_BY_MINES_BUFFER + MARKED_MINE_SHIFT)
    })
})