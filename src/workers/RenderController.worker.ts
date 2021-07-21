import { expose } from 'comlink';

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
    public init(fieldSize:Size, cellSize:number, layerSize:Size, layerGetter: LayerGetter, viewPortSize:Size):Promise<void> {
        this.style.cellSize = cellSize
        this.fieldSize = fieldSize
        this.layerSize = layerSize
        this.layerGetter = layerGetter
        this.viewPortSize = viewPortSize

        this.maxVisibleCells = {
            x: Math.ceil(this.layerSize.width / this.style.cellSize),
            y: Math.ceil(this.layerSize.height / this.style.cellSize),
        }

        this.maxVisibleLayers = {
            x: Math.ceil((fieldSize.width * cellSize) / layerSize.width),
            y: Math.ceil((fieldSize.height * cellSize) / layerSize.height),
        }

        return this.render({ x: 0, y: 0 })
    }

    public async render(scrollPosition:Position) {
        if (this.fieldSize && this.style.cellSize) {

            this.getVisibleLayers(scrollPosition).forEach((layerIndices) => {
                requestAnimationFrame(() => {
                    this.renderLayer(layerIndices)
                })
            })

            this.lasScrollPosition = scrollPosition
        }
    }

    private async renderLayer(layerIndices: Position) {
        const layer = await this.getLayer(layerIndices.x, layerIndices.y)

        if (!layer) {
            return
        }

        const context = layer.getContext('2d')

        if (!context) {
            return
        }

        const layerSnapshot = this.getLayerSnapshot(layer)

        if (layerSnapshot) {
            context.drawImage(layerSnapshot, 0, 0)
        }
        // TODO: implement layer render logic
    }

    private async getLayer(x: number, y: number) {
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

    private getLayerSnapshot(layer: OffscreenCanvas): OffscreenCanvas | undefined {
        // TODO: think about solution
        if (!this.layerSnapshot) {
            const context = layer.getContext('2d')

            if (!context) {
                return undefined
            }

            context.fillStyle = this.style.backgroundColor
            context.fillRect(0, 0, layer.width, layer.height);
            context.strokeStyle = this.style.borderColor
            context.strokeRect(0, 0, layer.width, layer.height);
            context.lineWidth = 1

            for (let x = 0; x < this.maxVisibleCells.x ; x++) {
                const targetX = x * this.style.cellSize!

                context.beginPath()
                context.moveTo(targetX, 0)
                context.lineTo(targetX, layer.height)
                context.stroke()
            }

            for (let y = 0; y < this.maxVisibleCells.y; y++) {
                const targetY = y * this.style.cellSize!

                context.beginPath()
                context.moveTo(0, y * this.style.cellSize!)
                context.lineTo(layer.width, targetY)
                context.stroke()
            }

            this.layerSnapshot = layer
        }

        return this.layerSnapshot
    }

    private getVisibleLayers(screenPosition: Position): Array<Position> {
        const visibleLayers = []

        if (this.viewPortSize) {
            const firstVisibleLayer = {
                x: Math.floor(screenPosition.x / this.layerSize.width),
                y: Math.floor(screenPosition.y / this.layerSize.height)
            }

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

    private style: CanvasStyle = {
        backgroundColor: 'grey',
        borderColor: 'black'
    }
    private fieldSize: Size|null = null
    private layerSize: Size = { width: 0, height: 0 }
    private maxVisibleCells: Position = { x: 0, y: 0 }
    private maxVisibleLayers: Position = { x: 0, y: 0 }
    private layerGetter: LayerGetter | null = null
    private layerCache: Map<string, OffscreenCanvas|undefined> = new Map<string, OffscreenCanvas|undefined>()
    private lasScrollPosition: Position | undefined
    private viewPortSize: Size | undefined
    private layerSnapshot: OffscreenCanvas | undefined;
}

expose(new RenderController());
