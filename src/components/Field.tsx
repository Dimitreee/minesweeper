import { wrap, transfer } from 'comlink'
import { useEffect, useRef, FC } from 'react'
import styled from 'styled-components'
import { Cell } from '../utils/Cell'
import RenderControllerWorker, { RenderController as IRenderController } from '../workers/RenderController.worker'

const renderController = wrap<IRenderController>(new RenderControllerWorker())

const CanvasContainer = styled.canvas`
  margin: auto;
  border: 1px solid black;
`

interface IFieldProps {
    size: {
        width: number,
        height: number,
    },
    totalMines: number
}

let scrollPosition = {
    x: 0,
    y: 0
}
let ticking = false

function doSomething(scroll_pos: { x:number, y:number }) {
    renderController.renderField(scroll_pos)
}

window.addEventListener('scroll', function(e) {
    scrollPosition.x = window.scrollX;
    scrollPosition.y = window.scrollY;

    if (!ticking) {
        window.requestAnimationFrame(function() {
            doSomething(scrollPosition);
            ticking = false;
        });

        ticking = true;
    }
});

export const Field:FC<IFieldProps> = (props) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const initField = async () => {
        if (canvasRef.current !== null) {
            const offscreen = canvasRef.current.transferControlToOffscreen()
            await renderController.initCanvas(
                transfer(offscreen, [offscreen]),
                props.size,
                Cell.Size,
                {
                    width: window.innerWidth,
                    height: window.innerHeight,
                },
            )
            await renderController.renderField({ x: 0, y:0 })
        }
    }

    useEffect(() => {
        initField()
    }, [canvasRef.current])

    const canvasSize = {
        width: props.size.width * Cell.Size,
        height: props.size.height * Cell.Size
    }

    return (
        <CanvasContainer ref={canvasRef} style={canvasSize} width={canvasSize.width} height={canvasSize.height}/>
    )
}