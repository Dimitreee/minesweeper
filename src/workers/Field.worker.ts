import { expose } from 'comlink';

export default {} as typeof Worker & { new (): Worker };

const fieldApi = {
    generateCells: (size: {width: number, height: number}): string => {
        const cells:{[key: string]: {x: number, y: number}} = {}
        let i = 0
        for (let row = 0; row < size.width; row ++) {
            for (let col = 0; col < size.height; col ++) {
                const x = row * 20;
                const y = col * 20;

                cells[i] = {x, y}

                i++
            }
        }

        return 'ок'
    },
};

// Expose API
expose(fieldApi);