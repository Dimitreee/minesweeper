import { wrap, transfer, proxy} from 'comlink'
import { totalmem } from 'os'
import { useEffect, useRef, FC, useCallback } from 'react'
import { Cell } from '../utils/Cell'
import { LayerController } from '../utils/LayerController'
import RenderControllerWorker, { RenderController as IRenderController } from '../workers/RenderController.worker'
import MinesController, { MinesController as IMinesController } from '../workers/MinesController.worker'

interface IFieldProps {
    size: {
        width: number,
        height: number,
    },
    totalMines: number
}

const renderController = wrap<IRenderController>(new RenderControllerWorker())
const minesController = wrap<IMinesController>(new MinesController())

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
        width: 40 * Cell.Size,
        height: 40 * Cell.Size,
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
            )

            return await renderController.init(
                props.size,
                Cell.Size,
                layerSize,
                proxy((x, y) => {
                    const canvas = layerController.current?.getLayer(x, y)
                    const transferredCanvas = canvas?.transferControlToOffscreen()

                    if (transferredCanvas) {
                        return transfer(transferredCanvas, [transferredCanvas])
                    }
                }),
                viewPortSize,
                proxy((position) => {
                    minesController.getLayerBuffer(position)
                })
            )
        }
    }, [rootRef, layerController])

    const handleClick = useCallback(async (e) => {
        const x = e.clientX + window.scrollX
        const y = e.clientY + window.scrollY

        await renderController.renderCell({ x, y })
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