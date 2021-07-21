export interface ISize {
    width: number
    height: number
}

export class LayerController {
    constructor (private root: HTMLDivElement, private fieldSize: ISize, private layerSize: ISize) {
    }

    public getLayer(x: number, y: number) {
        const level = this.layers.get(x)
        const layerOffset = {
            x: x * this.layerSize.width,
            y: y * this.layerSize.height,
        }

        if (layerOffset.x > this.fieldSize.width || layerOffset.y > this.fieldSize.width) {
            return null
        }

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