export interface ISize {
    width: number
    height: number
}

type Position = {
    x: number,
    y: number,
}

export class LayerController {
    constructor (private root: HTMLDivElement, private fieldSize: ISize, private layerSize: ISize, private cellSize: number) {
    }

    public getLayerByIndices(x: number, y: number) {
        const layerOffset = {
            x: x * this.layerSize.width,
            y: y * this.layerSize.height,
        }

        if (layerOffset.x > this.fieldSize.width || layerOffset.y > this.fieldSize.width) {
            return null
        }
        const level = this.layers.get(x)

        if (level) {
            if (level.has(y)) {
                return level.get(y)
            } else {
                const layer = this.createLayer(layerOffset.x, layerOffset.y)
                level.set(y, layer)

                return layer
            }
        } else {
            const newLayerLevel = new Map()
            const layer = this.createLayer(layerOffset.x, layerOffset.y)
            newLayerLevel.set(y, layer)

            this.layers.set(x, newLayerLevel)

            return layer
        }
    }

    public getCellIndices(screenBasedCoordinates:Position) {
        const layerIndices = this.getLayerIndices(screenBasedCoordinates)
        const layerRelativeCords = this.convertCordsToLayerRelative(screenBasedCoordinates, layerIndices)

        return {
            x: Math.floor(layerRelativeCords.x / this.cellSize),
            y: Math.floor(layerRelativeCords.y / this.cellSize),
        }
    }

    public getLayerIndices(screenBasedCoordinates:Position): Position {
        return {
            x: Math.floor(screenBasedCoordinates.x / (this.layerSize.width * this.cellSize)),
            y: Math.floor(screenBasedCoordinates.y / (this.layerSize.height * this.cellSize)),
        }
    }

    private convertCordsToLayerRelative(coordinates:Position, layerIndices:Position): Position {
        return {
            x: coordinates.x - layerIndices.x * this.layerSize.width,
            y: coordinates.y - layerIndices.y * this.layerSize.height,
        }
    }

    private createLayer(offsetX: number, offsetY: number) {
        const canvas = document.createElement('canvas')

        canvas.style.position = `absolute`
        canvas.style.top = `${offsetY}px`
        canvas.style.left = `${offsetX}px`
        canvas.width = this.layerSize.width
        canvas.height = this.layerSize.height

        this.root.appendChild(canvas)

        return canvas
    }

    private layers: Map<number, Map<number, HTMLCanvasElement>> = new Map()
}