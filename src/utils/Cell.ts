import { Canvas } from './Canvas'

type CellStyle = {
    width: number,
    height: number,
    backgroundColor: string,
    borderColor: string
}

export class Cell {
    public static Size = 20

    constructor(private canvas: Canvas, private position: [number, number], private hash: string) {
    }

    public render() {
        const context = this.canvas.getContext()
        if (context) {
            context.fillStyle = this.style.backgroundColor
            context.fillRect(this.position[0], this.position[1], this.style.width, this.style.height)
            context.strokeStyle = this.style.borderColor
            context.strokeRect(this.position[0], this.position[1], this.style.width, this.style.height)

            if (this.minesCounter) {
                context.font = '16px serif';
                context.fillStyle = 'black';
                context.textAlign = 'center';
                context.fillText(String(this.minesCounter), this.position[0] + Cell.Size/2, this.position[1] + 16, Cell.Size);
            }
        }
    }

    public activate(isMine?: boolean) {
        if (isMine) {
            this.setCellStyle({ backgroundColor: 'blue' })
        } else {
            this.setCellStyle({ backgroundColor: 'white' })
        }

        this.render()
    }

    public getCellPosition () {
        return this.position
    }

    public getCellHash () {
        return this.hash
    }

    public isTracked () {
        return this.tracked
    }

    public setIsTracked() {
        this.tracked = true
    }

    public setMinesCounter (minesCounter: number) {
        this.minesCounter = minesCounter
    }

    private setCellStyle (style: Partial<CellStyle>) {
        this.style = {...this.style, ...style}
    }

    private style: CellStyle = {
        width: Cell.Size,
        height: Cell.Size,
        backgroundColor: '#9D6A5F',
        borderColor: 'black'
    }
    private minesCounter: number = 0
    private tracked: boolean = false
}
