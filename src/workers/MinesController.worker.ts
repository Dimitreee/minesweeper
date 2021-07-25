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

    public updateLayerState(layerIndices: Position, cellIndices: Position) {
        const cacheKey = `${layerIndices.x}${layerIndices.y}`

        if (!this.layerStateCache.has(cacheKey)) {
            this.placeMines(layerIndices)
        }
    }

    public getLayerState(layerIndices: Position) {
        const { x, y } = layerIndices
        const cacheKey = `${x}${y}`

        if (this.layerStateCache.has(cacheKey)) {
            return this.layerStateCache.get(cacheKey)
        }

        if (this.maxVisibleLayers && this.maxVisibleCells && this.minesBuffer) {
            const bitesPerLayer = this.maxVisibleCells?.x * this.maxVisibleCells?.y
            const layerBufferFirstBite = (x + y * this.maxVisibleLayers?.x) * bitesPerLayer
            const layerState = new Uint8Array(this.minesBuffer, layerBufferFirstBite, bitesPerLayer)

            for (let i = 0; i < layerState.length; i++) {
                void(0)
            }

            this.layerStateCache.set(cacheKey, layerState)

            return layerState
        }
    }

    private placeMines(layerIndices: Position) {
        const layerState = this.getLayerState(layerIndices)

        if (layerState) {
            let i = 0

            while (this.totalMines! > 0 && i < layerState.byteLength) {
                if (this.totalMines) {
                    if (Math.random() > 0.9) {
                        layerState[i] = 1
                        this.totalMines -= 1
                    }
                    i++
                }
            }
        }
    }


    private minesBuffer: ArrayBuffer | null = null
    private cellSize: number | null = null
    private layerSize: Size | null = null
    private maxVisibleCells: Position | null = null
    private maxVisibleLayers: Position | null = null
    private totalMines: number | null = null
    private layerStateCache: Map<string, Uint8Array> = new Map()
}

const minesController = new MinesController()

expose(minesController)
