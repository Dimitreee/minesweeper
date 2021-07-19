import { wrap, transfer, proxy} from 'comlink'
import { useEffect, useRef, FC, useCallback } from 'react'
import { Cell } from '../utils/Cell'
import { LayerController } from '../utils/LayerController'
import RenderControllerWorker, { RenderController as IRenderController } from '../workers/RenderController.worker'

interface IFieldProps {
    size: {
        width: number,
        height: number,
    },
    totalMines: number
}

const renderController = wrap<IRenderController>(new RenderControllerWorker())

let frameId:number|null = null

export const Field:FC<IFieldProps> = (props) => {
    const rootRef = useRef<HTMLDivElement>(null)
    const layerController = useRef<LayerController>(null)

    const initRenderController = useCallback(async () => {
        if (rootRef.current) {
            const layerSize = {
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
                    const canvas = layerController.current?.getLayer(x, y)?.transferControlToOffscreen()

                    if (canvas) {
                        return transfer(canvas, [canvas])
                    }
                })
            )
        }
    }, [rootRef, layerController])

    useEffect(() => {
        initRenderController().then(() => {
            window.addEventListener('scroll', () => {
                if (!frameId) {
                    frameId = window.requestAnimationFrame(() => {
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
    },[])


    return (
        <div
            ref={rootRef}
            style={{ width: props.size.width * Cell.Size, height: props.size.height * Cell.Size, position: 'relative' }}
        />
    )
}