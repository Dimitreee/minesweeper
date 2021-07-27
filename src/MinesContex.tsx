import React, { SyntheticEvent } from 'react'
import { action, computed, makeAutoObservable, observable } from 'mobx'
import { computedFn } from 'mobx-utils'
import { GridOnItemsRenderedProps, GridOnScrollProps } from 'react-window'

export enum CellState {
    EMPTY = 0,
    VISITED_BY_MINES_BUFFER = 9,
    HAS_MINE = 10,
    ZERO_MINES = 11,
    FILLED = 12
}

export class MinesController {
    constructor(private fieldSize: { width: number, height: number }, public minesBuffer: Uint8Array, private totalMines: number) {
        makeAutoObservable(this, {
            handleCellClick: action,
            handleScroll: action,
            fillDirectionCache: observable.ref
        })
    }

    public updateVisibleGridState = (props: GridOnItemsRenderedProps) => {
        const {
            visibleColumnStartIndex,
            visibleColumnStopIndex,
            visibleRowStartIndex,
            visibleRowStopIndex,
        } = props

        for (let i = visibleColumnStartIndex; i < visibleColumnStopIndex; i++) {
            for (let j = visibleRowStartIndex; j < visibleRowStopIndex; j++) {
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
            // @ts-ignore
            const cachedData = [...this.fillDirectionCache[this.lastScrollDirection.direction]]
            if (cachedData.length) {
                // @ts-ignore
                this.fillDirectionCache[this.lastScrollDirection.direction] = []
                this.fillEmptyCells(cachedData)
            }
        }
    }

    public handleScroll = (props:GridOnScrollProps) => {
        const { scrollLeft, scrollTop } = props

        let direction;
        if (this.lastScrollDirection.scrollLeft > scrollLeft) {
            direction = 'left'
        } else if (this.lastScrollDirection.scrollLeft < scrollLeft) {
            direction = 'right'
        }

        if (this.lastScrollDirection.scrollTop > scrollTop) {
            direction = 'top'
        } else if ((this.lastScrollDirection.scrollTop < scrollTop)) {
            direction = 'bottom'
        }

        this.lastScrollDirection.direction = direction
        this.lastScrollDirection.scrollLeft = scrollLeft
        this.lastScrollDirection.scrollTop = scrollTop

    }

    public handleCellClick = (e:SyntheticEvent<HTMLDivElement>):void => {
        const x: number = Number(e.currentTarget.getAttribute('data-x')) || 0
        const y: number = Number(e.currentTarget.getAttribute('data-y')) || 0
        const biteIndex = this.getByteIndex(x, y)

        const prevCellState = this.minesBuffer[biteIndex]

        if (prevCellState === 10) {
            alert('YOu lose')
        } else {
            this.fillEmptyCells([{x, y}])
        }

    }

    public getCellState = computedFn((x:number, y:number) => {
        const cellBiteIndex = this.getByteIndex(x, y)

        if (this.lastUpdatedByte === cellBiteIndex) {
            return this.minesBuffer[this.lastUpdatedByte]
        }

        return this.minesBuffer[cellBiteIndex]
    })

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

    private fillEmptyCells = (initialStack: Array<{x: number, y: number}>) => {
        const nodes = initialStack

        while (nodes.length) {
            // @ts-ignore
            const { x, y } = nodes.pop()

            if (x < this.visibleLayerCords.visibleColumnStartIndex || x > this.visibleLayerCords.visibleColumnStopIndex || y < this.visibleLayerCords.visibleRowStartIndex || y > this.visibleLayerCords.visibleRowStopIndex) {
                if (x < this.visibleLayerCords.visibleColumnStartIndex) {
                    if (x > 0) {
                        this.fillDirectionCache.left.push({x, y})
                    }
                }

                if (x > this.visibleLayerCords.visibleColumnStopIndex) {
                    if (x < this.fieldSize.width) {
                        this.fillDirectionCache.right.push({x, y})
                    }
                }

                if (y < this.visibleLayerCords.visibleRowStartIndex) {
                    if (y > 0) {
                        this.fillDirectionCache.top.push({x, y})
                    }
                }

                if (y > this.visibleLayerCords.visibleRowStopIndex) {
                    if (y < this.fieldSize.height) {
                        this.fillDirectionCache.bottom.push({x, y})
                    }
                }
                continue
            }

            const cellBiteIndex = this.getByteIndex(x, y)
            const prevCellState = this.minesBuffer[cellBiteIndex]

            if ((prevCellState > 0 && prevCellState < 0) || prevCellState === CellState.ZERO_MINES ) {
                continue
            }

            const cellState = this.openCell(cellBiteIndex, x, y)

            if (cellState > 0 && cellState < 9) {
                continue
            }

            nodes.push({ x: x+1, y })
            nodes.push({ x: x-1, y })
            nodes.push({ x, y: y+1 })
            nodes.push({ x, y: y-1 })
        }
    }

    private getCellSiblingsMinesQuantity = (x: number, y: number) => {
        return [[x - 1, y - 1], [x, y - 1], [x + 1, y - 1], [x - 1, y], [x + 1, y], [x - 1, y + 1], [x, y + 1], [x + 1, y + 1]]
            .filter(([x, y]) => x >= 0 && y >= 0 && (x < this.fieldSize.width) && (y < this.fieldSize.height))
            .reduce((summOfMines, [x,y]) => {
                const biteIndex = this.getByteIndex(x, y)

                if (this.minesBuffer[biteIndex] === CellState.HAS_MINE) {
                    summOfMines += 1
                }

                return summOfMines
            }, 0)
    }

    private setLastUpdatedByte = (value: number | undefined) => {
        this.lastUpdatedByte = value
    }

    private getByteIndex = (x: number, y: number) => {
        return this.fieldSize.width * y + x
    }

    private lastUpdatedByte: number | undefined

    public fillDirectionCache: {
        right: Array<{x: number, y: number}>
        left: Array<{x: number, y: number}>
        top: Array<{x: number, y: number}>
        bottom: Array<{x: number, y: number}>
    } = {
        right: [],
        left: [],
        top: [],
        bottom: [],
    }

    public lastScrollDirection: {
        scrollLeft: number
        scrollTop: number
        direction: string | undefined,
    } = {
        scrollLeft: 0,
        scrollTop: 0,
        direction: undefined
    }

    private visibleLayerCords: Pick<
        GridOnItemsRenderedProps,
        'visibleColumnStartIndex'|
        'visibleColumnStopIndex' |
        'visibleRowStartIndex' |
        'visibleRowStopIndex'
        > =
        {
            visibleColumnStartIndex: 0,
            visibleColumnStopIndex: 17,
            visibleRowStartIndex: 0,
            visibleRowStopIndex: 17,
        }
}

