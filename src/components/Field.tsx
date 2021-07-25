import { transfer, proxy} from 'comlink'
import { useEffect, useRef, FC, useCallback } from 'react'
import { Cell } from '../utils/Cell'
import { LayerController } from '../utils/LayerController'

import { renderController, minesController } from '../workers'

interface IFieldProps {
    size: {
        width: number,
        height: number,
    },
    totalMines: number
}

let frameId:number|null = null

export const Field:FC<IFieldProps> = (props) => {
    const rootRef = useRef<HTMLDivElement>(null)
    const layerController = useRef<LayerController>(null)
    const layerSize = {
        /*
        *
        * feel free to configure <3
        * i'll recommend to use values multiple of Cell.Size
        *
        * */
        width: 20 * Cell.Size,
        height: 20 * Cell.Size,
    }

    const initLayerController = useCallback(async () => {
        if (rootRef.current) {
            const viewPortSize = {
                width: window.innerWidth,
                height: window.innerHeight,
            }

            // @ts-ignore
            layerController.current = new LayerController(
                rootRef.current,
                {
                    width: props.size.width * Cell.Size,
                    height: props.size.height * Cell.Size
                },
                layerSize,
                Cell.Size,
            )

            return await renderController.init(
                props.size,
                Cell.Size,
                layerSize,
                proxy((x, y) => {
                    const canvas = layerController.current?.getLayerByIndices(x, y)
                    const transferredCanvas = canvas?.transferControlToOffscreen()

                    if (transferredCanvas) {
                        return transfer(transferredCanvas, [transferredCanvas])
                    }
                }),
                viewPortSize,
            )
        }
    }, [rootRef, layerController])

    const handleClick = useCallback(async (e) => {
        if (layerController.current) {
            const cursorCords = {
                x: e.clientX + window.scrollX,
                y: e.clientY + window.scrollY,
            }

            const cellIndices = layerController.current.getCellIndices(cursorCords)
            const layerIndices = layerController.current.getLayerIndices(cursorCords)

            await minesController.updateLayerState(layerIndices, cellIndices)
            const layerState = await minesController.getLayerState(layerIndices)

            if (layerState) {
                await renderController.updateLayer(layerIndices, layerState, cellIndices)
            }
        }
    }, [])

    useEffect(() => {
        initLayerController().then(() => {
            window.addEventListener('scroll', () => {
                if (!frameId) {
                    frameId = requestAnimationFrame(() => {
                        renderController
                            .render({ x: window.scrollX, y: window.scrollY })
                            .then(() => {
                                frameId = null;
                            });
                    });
                }
            });
        })
    }, [rootRef.current])

    useEffect(() => {
        window.scrollTo(0, 0)

        minesController.init(props.size, Cell.Size, layerSize, props.totalMines)
    },[])

    return (
        <div
            ref={rootRef}
            style={{
                width: props.size.width * Cell.Size,
                height: props.size.height * Cell.Size,
                position: 'relative',
            }}
            onClick={handleClick}
        />
    )
}