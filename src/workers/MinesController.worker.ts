import { expose, transfer } from 'comlink'

export default {} as typeof Worker & { new (): Worker };

type Size = {
    width: number,
    height: number,
}

type Position = {
    x: number,
    y: number,
}

export class MinesController {
    public init(fieldSize: Size, cellSize: number, layerSize:Size, totalMines: number ) {
        this.cellSize = cellSize
        this.layerSize = layerSize
        this.totalMines = totalMines

        this.maxVisibleCells = {
            x: Math.ceil(this.layerSize.width / this.cellSize),
            y: Math.ceil(this.layerSize.height / this.cellSize),
        }

        this.maxVisibleLayers = {
            x: Math.ceil((fieldSize.width * cellSize) / layerSize.width),
            y: Math.ceil((fieldSize.height * cellSize) / layerSize.height),
        }

        this.minesBuffer = new ArrayBuffer(this.maxVisibleLayers.x * this.maxVisibleLayers.y * this.maxVisibleCells.x * this.maxVisibleCells.y)
    }

    public getLayerBuffer(layerIndices:Position) {
        if (this.maxVisibleLayers && this.maxVisibleCells && this.minesBuffer) {
            const { x, y } = layerIndices
            const bitesPerLayer = this.maxVisibleCells?.x * this.maxVisibleCells?.y
            const layerBufferFirstBite = (x + y * this.maxVisibleLayers?.x) * bitesPerLayer

            const layerState = new Uint8Array(this.minesBuffer, layerBufferFirstBite, bitesPerLayer)

            let i = 0

            while (this.totalMines! > 0 && i < layerState.byteLength) {
                if (this.totalMines) {
                    if (Math.random() > 0.5) {
                        layerState[i] = 1
                        this.totalMines -= 1
                    }

                    i++
                }
            }

            return layerState
        }
    }

    private minesBuffer: ArrayBuffer | null = null
    private cellSize: number | null = null
    private layerSize: Size | null = null
    private maxVisibleCells: Position | null = null
    private maxVisibleLayers: Position | null = null
    private totalMines: number | null = null
}

const minesController = new MinesController()

expose(minesController)
