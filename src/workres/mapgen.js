import { createNoise2D } from 'simplex-noise';

// declare type ItemData = {
//     type: ItemType;
//     position: {
//       x: number;
//       y: number;
//     };
//     age: number;
//     status: ItemStatus;
//   };

export const mapgen = {
    generateMap: (width, height, seed, scale = 0.05) => {
        // 忽略 seed，或者用 seed 生成确定性的噪声实例（需自行实现）
        const noise2D = createNoise2D();
        const map = [];
        for (let x = 0; x < width; x++) {
            map.push([]);
            for (let y = 0; y < height; y++) {
                const value = noise2D(x * scale, y * scale);

                const mapItem = {
                    type: 'map',
                    position: { x: x, y: y },
                    value: value,
                    age: 0,
                    status: 'normal',
                };
                map[x].push(mapItem);
            }
        }
        return map;
    }
};