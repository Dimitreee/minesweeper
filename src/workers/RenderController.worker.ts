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

function getScrollDirection (nextScroll: Position, prevScroll?:Position): 'TOP' | 'LEFT' | 'BOTTOM' | 'RIGHT' | null {
    if (!prevScroll) {
        return null
    }

    if (nextScroll.x - prevScroll.x > 0) {
        return 'RIGHT'
    } else if (nextScroll.x - prevScroll.x < 0) {
        return 'LEFT'
    } else if (nextScroll.y - prevScroll.y > 0) {
        return 'BOTTOM'
    } else if (nextScroll.y - prevScroll.y < 0) {
        return 'TOP'
    }

    return null
}

export class RenderController {
    public init(fieldSize:Size, cellSize:number, layerSize:Size, layerGetter: LayerGetter):Promise<void> {
        this.style.cellSize = cellSize
        this.fieldSize = fieldSize
        this.layerSize = layerSize
        this.layerGetter = layerGetter

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

            const layerIndices = {
                x: Math.floor(scrollPosition.x / this.layerSize.width),
                y: Math.floor(scrollPosition.y / this.layerSize.height),
            }

            const direction = getScrollDirection(scrollPosition, this.lasScrollPosition)

            if (direction === 'RIGHT' && layerIndices.x + 1 < this.maxVisibleLayers.x ) {
                layerIndices.x = layerIndices.x + 1
            }

            if (direction === 'LEFT' && layerIndices.x - 1 > 0) {
                layerIndices.x = layerIndices.x - 1
            }

            if (direction === 'TOP' && layerIndices.y - 1 > 0) {
                layerIndices.y = layerIndices.y - 1
            }

            if (direction === 'BOTTOM' && layerIndices.y + 1 < this.maxVisibleLayers.y) {
                layerIndices.y = layerIndices.y + 1
            }

            requestAnimationFrame(() => {
                this.renderLayer(layerIndices)

                this.lasScrollPosition = scrollPosition
            })
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

        // TODO: implement layer render logic
        context.fillStyle = "blue"
        context.fillRect(0, 0, layer.width, layer.height);

        // const horizontalCellsCount = this.maxVisibleCells.x
        // const verticalCellsCount = this.maxVisibleCells.y
        //
        // if (this.style.cellSize) {
        //     const maxX = horizontalCellsCount * this.style.cellSize
        //     const maxY = verticalCellsCount * this.style.cellSize
        //
        //     for (let i = 0; i < horizontalCellsCount; i ++) {
        //         context?.beginPath()
        //         context?.moveTo(i * this.style?.cellSize, 0)
        //         context?.lineTo(i * this.style?.cellSize, maxY);
        //         context?.stroke();
        //     }
        //
        //     for (let i = 0; i < verticalCellsCount; i++) {
        //         context?.beginPath()
        //         context?.moveTo(0, i * this.style?.cellSize)
        //         context?.lineTo(maxX, i * this.style?.cellSize)
        //         context?.stroke();
        //     }
        // }
    }

    private async getLayer(x: number, y: number) {
        const cacheKey = `${x}${y}`

        if (this.layerCache.has(cacheKey)) {
            return this.layerCache.get(cacheKey)
        }

        if (this.layerGetter) {
            const canvas = await this.layerGetter(x, y)
            this.layerCache.set(cacheKey, canvas)

            return canvas
        }

        return null
    }

    private style: CanvasStyle = {
        backgroundColor: 'black',
        borderColor: 'black'
    }
    private fieldSize: Size|null = null
    private layerSize: Size = { width: 0, height: 0 }
    private maxVisibleCells: Position = { x: 0, y: 0 }
    private maxVisibleLayers: Position = { x: 0, y: 0 }
    private layerGetter: LayerGetter | null = null
    private layerCache: Map<string, OffscreenCanvas|undefined> = new Map<string, OffscreenCanvas|undefined>()
    private lasScrollPosition: Position | undefined
}


expose(new RenderController());