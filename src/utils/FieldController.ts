import { wrap } from 'comlink'
import { Canvas } from './Canvas'
import { Cell } from './Cell'
import FieldWorker from '../workers/Field.worker'

export const generateCellHash = (x: number, y: number) => {
    return `${x - ( x % Cell.Size )}${y - ( y % Cell.Size)}`
}

const generateRandomPairs = (minX: number, maxX:number, minY: number, maxY:number) => {
    return [Math.random() * (maxX - minX) + minX, Math.random() * (maxY - minY) + minY];
}

export class FieldController {
    constructor(
        private canvas: Canvas,
        private size: { width: number, height: number },
        private totalMines: number,
    ) {}

    public initListener() {
        const canvas = this.canvas.getCanvas()
        canvas.addEventListener('click', (e: MouseEvent) => {
            const { clientX, clientY } = e
            const canvasPosition = canvas.getBoundingClientRect()

            const xMin = canvasPosition.x;
            const xMax = canvasPosition.x + canvasPosition.width;
            const yMin = canvasPosition.y;
            const yMax = canvasPosition.y + canvasPosition.height;

            if (clientX > xMin && clientX < xMax && clientY > xMin && clientY < yMax) {
                const layerX = clientX - xMin;
                const layerY = clientY - yMin;
                const cellHash = generateCellHash(layerX, layerY)
                const mine = this.mines.has(cellHash)

                if (mine) {
                    this.activateMines()
                } else {
                    this.activateCell(cellHash)
                }
            }
        })
    }

    public placeCells() {
        for (let row = 0; row < this.size.width; row ++) {
            for (let col = 0; col < this.size.height; col ++) {
                const x = row * Cell.Size;
                const y = col * Cell.Size
                const cellHash = generateCellHash(x, y)
                const cell = new Cell(this.canvas, [x, y], cellHash)
                this.cells.set(generateCellHash(x, y), cell)
                cell.render()
            }
        }
    }

    public placeMines() {
        for (let i = 0; i < this.totalMines; i ++) {
            const [mineX, mineY] = generateRandomPairs(0, this.size.width * Cell.Size, 0, this.size.height * Cell.Size)
            const mineHash = generateCellHash(mineX, mineY)

            this.mines.add(mineHash)
        }
    }

    private activateMines() {
        this.mines.forEach((mine) => {
            this.cells.get(mine)?.activate(true)
        })
    }

    private activateCell(cellHash: string) {
        const cell = this.cells.get(cellHash)
        if (cell) {
            cell?.activate()
            const cellSiblings = this.getCellSiblings(...cell.getCellPosition())
            const minesQuantitiy = this.getCellMinesQuantity(cellSiblings)

            if (minesQuantitiy > 0) {
                cell.setMinesCounter(minesQuantitiy)
                cell.activate()
            } else {
                cell.activate()
                this.activateCellSiblings([cell])
            }
        }
    }

    private activateCellSiblings(siblings:Array<Cell|undefined>) {
        let siblingsStack: Array<Cell|undefined> = [...siblings]

        while (siblingsStack.length !== 0) {
            const currentSibling = siblingsStack.shift()

            if (currentSibling) {
                const cellSiblings = this.getCellSiblings(...currentSibling.getCellPosition())
                const mine = this.mines.has(currentSibling.getCellHash())

                if (!mine) {
                    const minesQuantitiy = this.getCellMinesQuantity(cellSiblings)

                    if (minesQuantitiy > 0) {
                        currentSibling.setMinesCounter(minesQuantitiy)
                        currentSibling.activate()
                    } else {
                        currentSibling.activate()

                        for (let i = 0; i < cellSiblings.length; i++) {
                            if (!cellSiblings[i]?.isTracked()) {
                                cellSiblings[i]?.setIsTracked()
                                siblingsStack.push(cellSiblings[i])
                            }
                        }
                    }
                }
            }
        }
    }

    private getCellMinesQuantity(siblings:Array<Cell|undefined>) {
        return siblings.reduce<number>((minesQuantity, sibling) => {
            if (sibling && this.mines.has(sibling.getCellHash())) {
                return minesQuantity + 1
            }

            return  minesQuantity
        }, 0)
    }

    private getCellSiblings(x: number, y: number): Array<Cell|undefined> {
        return [
            [x - Cell.Size, y - Cell.Size],
            [x, y - Cell.Size],
            [x + Cell.Size, y - Cell.Size],
            [x - Cell.Size, y],
            [x + Cell.Size, y],
            [x - Cell.Size, y + Cell.Size],
            [x, y + Cell.Size],
            [x + Cell.Size, y + Cell.Size],
        ]
            .filter(([x, y]) => x >= 0 && y >= 0 && (x < this.size.width * Cell.Size) && (y < this.size.height * Cell.Size))
            .map(([x, y]) => generateCellHash(x, y))
            .map((hash) => this.cells.get(hash))
    }

    private cells: Map<string, Cell> = new Map<string, Cell>()
    private mines: Set<string> = new Set<string>()
}
