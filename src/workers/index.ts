import { wrap } from 'comlink'
import RenderControllerWorker, { RenderController as IRenderController } from '../workers/RenderController.worker'
import MinesController, { MinesController as IMinesController } from '../workers/MinesController.worker'

export const renderController = wrap<IRenderController>(new RenderControllerWorker())
export const minesController = wrap<IMinesController>(new MinesController())
