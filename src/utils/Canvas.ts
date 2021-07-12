export class Canvas {
    constructor(private canvas: HTMLCanvasElement) {
        this.context = canvas.getContext("2d");
    }

    public getCanvas() {
        return this.canvas
    }

    public getContext() {
        return this.context
    }

    private context: CanvasRenderingContext2D | null = null
}
