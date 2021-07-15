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

export class RenderController {
    public initCanvas(canvas:OffscreenCanvas, canvasSize:Size, cellSize:number, viewPortSize:Size):void {
        this.style.cellSize = cellSize
        this.canvas = canvas
        this.canvasContext = this.canvas.getContext('2d')
        this.canvasSize = canvasSize
        this.viewPortSize = viewPortSize

        if (this.canvasContext) {
            this.canvasContext.fillStyle = this.style.backgroundColor
            this.canvasContext.strokeStyle = this.style.borderColor
        }
    }

    public renderField(scrollPosition:Position):void {
        const context = this.canvas?.getContext('2d')

        if (context && this.canvasSize && this.style.cellSize) {
            context.fillStyle = this.style.backgroundColor
            context.strokeStyle = this.style.borderColor

            const topLeftVisibleCellIndices = {
                x: Math.floor(scrollPosition.x / this.style.cellSize),
                y: Math.floor(scrollPosition.y / this.style.cellSize),
            }

            const maxVisibleCells = {
                x: Math.ceil(this.viewPortSize.width / this.style.cellSize),
                y: Math.ceil(this.viewPortSize.height / this.style.cellSize),
            }

            // Layer is a collection of cells.
            const renderLayerIndices = {
                x: Math.floor(topLeftVisibleCellIndices.x / maxVisibleCells.x),
                y: Math.floor(topLeftVisibleCellIndices.y / maxVisibleCells.y),
            }

            const xMin = renderLayerIndices.x * maxVisibleCells.x
            const xMax = xMin + maxVisibleCells.x * 2
            const yMin = renderLayerIndices.y * maxVisibleCells.y
            const yMax = yMin + maxVisibleCells.y * 2

            requestAnimationFrame(() => {
                this.renderPartial(xMin, xMax, yMin, yMax)
            })
        }
    }

    private renderPartial(xMin:number, xMax:number, yMin:number, yMax:number):void {
        const context = this.canvas?.getContext('2d')

        if (context && this.canvasSize && this.style.cellSize) {
            const maxY = yMax * this.style.cellSize
            const maxX = xMax * this.style.cellSize

            for (let i = xMin; i < xMax; i ++) {
                this.canvasContext?.beginPath()
                this.canvasContext?.moveTo(i * this.style?.cellSize, 0)
                this.canvasContext?.lineTo(i * this.style?.cellSize, maxY);
                this.canvasContext?.stroke();
            }

            for (let i = yMin; i < yMax; i++) {
                this.canvasContext?.beginPath()
                this.canvasContext?.moveTo(0, i * this.style?.cellSize)
                this.canvasContext?.lineTo(maxX, i * this.style?.cellSize)
                this.canvasContext?.stroke();
            }
        }
    }

    private canvas: OffscreenCanvas|null = null
    private style: CanvasStyle = {
        backgroundColor: '#9D6A5F',
        borderColor: 'black'
    }
    private canvasSize: Size|null = null
    private canvasContext: OffscreenCanvasRenderingContext2D|null = null
    private viewPortSize: Size = { width: 0, height: 0 }
}

expose(new RenderController());