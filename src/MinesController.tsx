import { action, makeAutoObservable, observable } from 'mobx'
import { computedFn } from 'mobx-utils'
import { GridOnItemsRenderedProps, GridOnScrollProps } from 'react-window'

export enum CellState {
    EMPTY = 0,
    VISITED_BY_MINES_BUFFER = 9,
    HAS_MINE = 10,
    ZERO_MINES = 11,
}

export const MARKED_MINE_SHIFT = 12

type Position = {
    x: number,
    y: number,
}

enum FillDirection {
    LEFT = 'left',
    RIGHT = 'right',
    TOP = 'top',
    BOTTOM = 'bottom',
}

type FillDirectionCache = {
    [FillDirection.LEFT]: Array<Position>
    [FillDirection.RIGHT]: Array<Position>
    [FillDirection.TOP]: Array<Position>
    [FillDirection.BOTTOM]: Array<Position>
}

type VisibleCords = Pick<
    GridOnItemsRenderedProps,
    'visibleColumnStartIndex'|
    'visibleColumnStopIndex' |
    'visibleRowStartIndex' |
    'visibleRowStopIndex'
    >

type LastScrollDirection = {
    scrollLeft: number
    scrollTop: number
    direction: FillDirection | undefined,
}

export class MinesController {
    public fillDirectionCellsCache:FillDirectionCache = {
        [FillDirection.LEFT]: [],
        [FillDirection.RIGHT]: [],
        [FillDirection.TOP]: [],
        [FillDirection.BOTTOM] : []
    }

    public lastScrollDirection:LastScrollDirection = {
        scrollLeft: 0,
        scrollTop: 0,
        direction: undefined
    }

    constructor(
        private fieldSize: { width: number, height: number },
        public minesBuffer: Uint8Array,
        private totalMines: number,
        private overscan: number
    ) {
        makeAutoObservable(this, {
            handleCellClick: action,
            handleScroll: action,
            fillDirectionCellsCache: observable.ref
        })
    }

    public updateVisibleGridCellsState = (props: GridOnItemsRenderedProps) => {
        const {
            visibleColumnStartIndex,
            visibleColumnStopIndex,
            visibleRowStartIndex,
            visibleRowStopIndex,
        } = props

        const maxColumn = visibleColumnStopIndex + this.overscan < this.fieldSize.width ? visibleColumnStopIndex + this.overscan : visibleColumnStopIndex
        const minColumn = visibleColumnStartIndex - this.overscan > this.fieldSize.width ? visibleColumnStartIndex - this.overscan : visibleColumnStartIndex
        const maxRow = visibleRowStopIndex + this.overscan < this.fieldSize.height ? visibleRowStopIndex + this.overscan : visibleRowStopIndex
        const minRow = visibleRowStartIndex - this.overscan > this.fieldSize.height ? visibleRowStartIndex - this.overscan : visibleRowStartIndex

        for (let i = minColumn; i < maxColumn; i++) {
            for (let j = minRow; j < maxRow; j++) {
                const biteIndex = this.getByteIndex(i, j)

                if (this.minesBuffer[biteIndex] === CellState.EMPTY) {
                    if (this.totalMines > 0 && Math.random() > 0.9) {
                        this.totalMines -= 1
                        this.minesBuffer[biteIndex] = CellState.HAS_MINE
                    } else {
                        this.minesBuffer[biteIndex] = CellState.VISITED_BY_MINES_BUFFER
                    }
                }
            }
        }

        this.visibleLayerCords = {
            visibleColumnStartIndex,
            visibleColumnStopIndex,
            visibleRowStartIndex,
            visibleRowStopIndex,
        }

        if (this.lastScrollDirection.direction) {
            // continue flood fill if previous layer iteration didn't succeed
            const remainingCells = [...this.fillDirectionCellsCache[this.lastScrollDirection.direction]]

            if (remainingCells.length) {
                this.fillDirectionCellsCache[this.lastScrollDirection.direction] = []
                this.fillEmptyCells(remainingCells)
            }
        }
    }

    public handleScroll = (props:GridOnScrollProps) => {
        const { scrollLeft, scrollTop } = props

        let direction

        if (this.lastScrollDirection.scrollLeft > scrollLeft) {
            direction = FillDirection.LEFT
        } else if (this.lastScrollDirection.scrollLeft < scrollLeft) {
            direction = FillDirection.RIGHT
        }

        if (this.lastScrollDirection.scrollTop > scrollTop) {
            direction = FillDirection.TOP
        } else if ((this.lastScrollDirection.scrollTop < scrollTop)) {
            direction = FillDirection.BOTTOM
        }

        this.lastScrollDirection.direction = direction
        this.lastScrollDirection.scrollLeft = scrollLeft
        this.lastScrollDirection.scrollTop = scrollTop
    }

    public handleCellClick = (x:number, y:number):void => {
        const biteIndex = this.getByteIndex(x, y)

        const cellState = this.minesBuffer[biteIndex]

        if (cellState === 10) {
            alert('You lose')
        } else {
            this.fillEmptyCells([{x, y}])
        }
    }

    public markMine = (x:number, y:number): void => {
        const biteIndex = this.getByteIndex(x, y)

        const cellState = this.minesBuffer[biteIndex]

        if (cellState === CellState.EMPTY || cellState === CellState.VISITED_BY_MINES_BUFFER || cellState === CellState.HAS_MINE) {
            this.minesBuffer[biteIndex] = cellState + MARKED_MINE_SHIFT
            this.setLastUpdatedByte(biteIndex)
        } else if (cellState > 11) {
            this.minesBuffer[biteIndex] = cellState - MARKED_MINE_SHIFT
            this.setLastUpdatedByte(biteIndex)
        }
    }

    public getCellState = computedFn((x:number, y:number) => {
        const cellBiteIndex = this.getByteIndex(x, y)

        if (this.lastUpdatedByte === cellBiteIndex) {
            return this.minesBuffer[this.lastUpdatedByte]
        }

        return this.minesBuffer[cellBiteIndex]
    })

    private fillEmptyCells = (initialStack: Array<Position>) => {
        // Flood fill
        const cells = initialStack

        while (cells.length) {
            const cell = cells.pop()

            if (!cell) {
                continue
            }

            const { x, y } = cell

            if (x < this.visibleLayerCords.visibleColumnStartIndex) {
                if (x >= 0) {
                    this.fillDirectionCellsCache[FillDirection.LEFT].push({x, y})
                }

                continue
            }

            if (x > this.visibleLayerCords.visibleColumnStopIndex) {
                if (x <= this.fieldSize.width) {
                    this.fillDirectionCellsCache[FillDirection.RIGHT].push({x, y})
                }

                continue
            }

            if (y < this.visibleLayerCords.visibleRowStartIndex) {
                if (y >= 0) {
                    this.fillDirectionCellsCache[FillDirection.TOP].push({x, y})
                }

                continue
            }

            if (y > this.visibleLayerCords.visibleRowStopIndex) {
                if (y <= this.fieldSize.height) {
                    this.fillDirectionCellsCache[FillDirection.BOTTOM].push({x, y})
                }

                continue
            }

            const cellBiteIndex = this.getByteIndex(x, y)
            const prevCellState = this.minesBuffer[cellBiteIndex]

            if ((prevCellState > 0 && prevCellState < 9) || prevCellState === CellState.ZERO_MINES || prevCellState === CellState.HAS_MINE) {
                continue
            }

            const cellState = this.openCell(cellBiteIndex, x, y)

            if (cellState > 0 && cellState < 9) {
                continue
            }

            cells.push({ x: x + 1, y })
            cells.push({ x: x- 1, y })
            cells.push({ x, y: y + 1 })
            cells.push({ x, y: y - 1 })
        }
    }

    private openCell = (biteIndex:number, x:number, y:number) => {
        const cellSiblingMinesCount = this.getCellSiblingsMinesQuantity(x, y)

        if (cellSiblingMinesCount === 0) {
            this.minesBuffer[biteIndex] = CellState.ZERO_MINES
        } else {
            this.minesBuffer[biteIndex] = cellSiblingMinesCount
        }

        this.setLastUpdatedByte(biteIndex)
        return this.minesBuffer[biteIndex]
    }

    private getCellSiblingsMinesQuantity = (x: number, y: number) => {
        return [[x - 1, y - 1], [x, y - 1], [x + 1, y - 1], [x - 1, y], [x + 1, y], [x - 1, y + 1], [x, y + 1], [x + 1, y + 1]]
            // use cell's which is inside area
            .filter(([x, y]) => x >= 0 && y >= 0 && (x < this.fieldSize.width) && (y < this.fieldSize.height))
            .reduce((summOfMines, [x,y]) => {
                const biteIndex = this.getByteIndex(x, y)

                if (this.minesBuffer[biteIndex] === CellState.HAS_MINE || (this.minesBuffer[biteIndex] - MARKED_MINE_SHIFT) === CellState.HAS_MINE) {
                    summOfMines += 1
                }

                return summOfMines
            }, 0)
    }

    private setLastUpdatedByte = (biteIndex: number | undefined) => {
        this.lastUpdatedByte = biteIndex
    }

    private getByteIndex = (x: number, y: number) => {
        return this.fieldSize.width * y + x
    }

    private lastUpdatedByte: number | undefined

    private visibleLayerCords:VisibleCords = {
        visibleColumnStartIndex: 0,
        visibleColumnStopIndex: 17,
        visibleRowStartIndex: 0,
        visibleRowStopIndex: 17,
    }
}

