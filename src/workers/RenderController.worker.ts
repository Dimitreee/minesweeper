import { expose } from 'comlink'

export default {} as typeof Worker & { new (): Worker };

type Position = {
    x: number,
    y: number,
}

type Size = {
    width: number,
    height: number,
}

type CanvasStyle = {
    backgroundColor:string,
    borderColor:string
    cellSize?:number
}

type LayerGetter = (x:number, y:number) => OffscreenCanvas | undefined

export class RenderController {
    public init(fieldSize:Size, cellSize:number, layerSize:Size, layerGetter: LayerGetter, viewPortSize:Size, getLayerBuffer: (layerIndices: Position) => void):Promise<void> {
        this.fieldStyle.cellSize = cellSize
        this.fieldSize = fieldSize
        this.layerSize = layerSize
        this.layerGetter = layerGetter
        this.viewPortSize = viewPortSize
        this.getLayerBuffer = getLayerBuffer

        this.maxVisibleCells = {
            x: Math.ceil(this.layerSize.width / this.fieldStyle.cellSize),
            y: Math.ceil(this.layerSize.height / this.fieldStyle.cellSize),
        }

        this.maxVisibleLayers = {
            x: Math.ceil((fieldSize.width * cellSize) / layerSize.width),
            y: Math.ceil((fieldSize.height * cellSize) / layerSize.height),
        }

        return this.render({ x: 0, y: 0 })
    }

    public async render(scrollPosition:Position) {
        if (this.fieldSize && this.fieldStyle.cellSize) {

            this.getVisibleLayers(scrollPosition).forEach((layerIndices) => {
                requestAnimationFrame(() => {
                    this.renderLayer(layerIndices)
                })
            })

            this.lasScrollPosition = scrollPosition
        }
    }

    public async renderCell(cursorPosition:Position) {
        if (this.fieldStyle.cellSize) {
            const layerIndices = this.getLayerIndices(cursorPosition)
            const layer = await this.getLayerFromCache(layerIndices)
            const layerRelativeCords = this.convertCordsToRelative(cursorPosition, layerIndices)
            const cellIndices = {
                x: Math.floor(layerRelativeCords.x / this.fieldStyle.cellSize),
                y: Math.floor(layerRelativeCords.y / this.fieldStyle.cellSize),
            }

            if (layer) {
                const context = layer.getContext('2d')

                if (context) {
                    const x = cellIndices.x * this.fieldStyle.cellSize
                    const y = cellIndices.y * this.fieldStyle.cellSize

                    if (this.getLayerBuffer) {
                        let buffer = await this.getLayerBuffer(layerIndices)
                        console.log(buffer)
                    }

                    context.fillStyle = this.cellStyle.backgroundColor
                    context.fillRect(x, y, this.fieldStyle.cellSize, this.fieldStyle.cellSize)
                    context.strokeStyle = this.cellStyle.borderColor
                    context.strokeRect(x, y, this.fieldStyle.cellSize, this.fieldStyle.cellSize)
                }
            }
        }
    }

    private async renderLayer(layerIndices:Position) {
        const layer = await this.getLayer(layerIndices)

        if (!layer) {
            return
        }

        const context = layer.getContext('2d')

        if (!context) {
            return
        }

        context.fillStyle = this.fieldStyle.backgroundColor
        context.fillRect(0, 0, layer.width, layer.height);
        context.strokeStyle = this.fieldStyle.borderColor
        context.strokeRect(0, 0, layer.width, layer.height);
        context.lineWidth = 1

        for (let x = 0; x < this.maxVisibleCells.x ; x++) {
            const targetX = x * this.fieldStyle.cellSize!

            context.beginPath()
            context.moveTo(targetX, 0)
            context.lineTo(targetX, layer.height)
            context.stroke()
        }

        for (let y = 0; y < this.maxVisibleCells.y; y++) {
            const targetY = y * this.fieldStyle.cellSize!

            context.beginPath()
            context.moveTo(0, y * this.fieldStyle.cellSize!)
            context.lineTo(layer.width, targetY)
            context.stroke()
        }
        // TODO: implement layer render logic
    }

    private async getLayerFromCache(indices:Position) {
        const { x, y } = indices
        const cacheKey = `${x}${y}`

        if (this.layerCache.has(cacheKey)) {
            return this.layerCache.get(cacheKey)
        } else {
            if (this.layerGetter) {
                const canvas = await this.layerGetter(x, y)
                this.layerCache.set(cacheKey, canvas)

                return canvas
            }
        }

        return null
    }

    private async getLayer(indices:Position) {
        const { x, y } = indices
        const cacheKey = `${x}${y}`

        // TODO: think about simplier solution
        if (!this.layerCache.has(cacheKey)) {
            if (this.layerGetter) {
                const canvas = await this.layerGetter(x, y)
                this.layerCache.set(cacheKey, canvas)

                return canvas
            }
        }

        return null
    }

    private getVisibleLayers(screenPosition:Position): Array<Position> {
        const visibleLayers = []

        if (this.viewPortSize) {
            const firstVisibleLayer = this.getLayerIndices(screenPosition)

            /*
            *
            * Calculating maxVisibleLayers using 'sliding window'.
            * _[_<_][__][_>_]_
            *
            * [ - left side of layer
            * ] - right side of layer
            * < - left side of window
            * > - right side of window
            *
            * */
            const maxHorizontalVisibleLayers = Math.ceil(this.viewPortSize.width / this.layerSize.width) + 1
            const maxVerticalVisibleLayers = Math.ceil(this.viewPortSize.height / this.layerSize.height) + 1

            for (let i = 0; i < maxHorizontalVisibleLayers; i++) {
                for (let j = 0; j < maxVerticalVisibleLayers; j++) {
                    visibleLayers.push({
                        x: firstVisibleLayer.x + i,
                        y: firstVisibleLayer.y + j,
                    })
                }
            }
        }

        return visibleLayers
    }

    private getLayerIndices(screenBasedCoordinates:Position): Position {
        return {
            x: Math.floor(screenBasedCoordinates.x / this.layerSize.width),
            y: Math.floor(screenBasedCoordinates.y / this.layerSize.height),
        }
    }

    private convertCordsToRelative(coordinates:Position, layerIndices:Position): Position {
        return {
            x: coordinates.x - layerIndices.x * this.layerSize.width,
            y: coordinates.y - layerIndices.y * this.layerSize.height,
        }
    }

    private fieldStyle: CanvasStyle = {
        backgroundColor: 'grey',
        borderColor: 'black',
    }
    private cellStyle: CanvasStyle = {
        backgroundColor: 'white',
        borderColor: 'grey',
    }
    private fieldSize: Size|null = null
    private layerSize: Size = { width: 0, height: 0 }
    private maxVisibleCells: Position = { x: 0, y: 0 }
    private maxVisibleLayers: Position = { x: 0, y: 0 }
    private layerGetter: LayerGetter | null = null
    private layerCache: Map<string, OffscreenCanvas|undefined> = new Map<string, OffscreenCanvas|undefined>()
    private lasScrollPosition: Position | undefined
    private viewPortSize: Size | undefined
    private getLayerBuffer: ((layerIndices: Position) => void) | undefined
}

const renderController = new RenderController()

expose(renderController);
