import { useEffect, useRef, FC } from 'react'
import styled from 'styled-components'
import { Canvas } from '../utils/Canvas'
import { Cell } from '../utils/Cell'
import { FieldController } from '../utils/FieldController'

// (field size is up to 10^4 x 10^4, number of bombs 1 < k < 10^8 - 1)

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

export const Field:FC<IFieldProps> = (props) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        if (canvasRef.current !== null) {
            const field = new FieldController(
                new Canvas(canvasRef.current),
                props.size,
                props.totalMines,
            )

            field.placeCells()
            field.initListener()
            field.placeMines()
        }

    }, [canvasRef.current])

    const canvasSize = {
        width: props.size.width * Cell.Size,
        height: props.size.height * Cell.Size
    }

    return (
        <CanvasContainer ref={canvasRef} style={canvasSize} width={canvasSize.width} height={canvasSize.height}/>
    )
}