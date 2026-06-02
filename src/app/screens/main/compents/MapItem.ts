import { Item } from "./Item";
import { Graphics } from "pixi.js";
import { baseConfig } from "../../../baseConfig";
 
export class MapItem extends Item {
  private graphics: Graphics;
   
  constructor(data: ItemData) {
    super(data);
    
    this.graphics = new Graphics();
    this.graphics.rect(0, 0, baseConfig.defaultCellSize, baseConfig.defaultCellSize);
    // 临时生成一个颜色
    const val = Number((data as any).value);
    if (isNaN(val)) {
        console.error('Invalid value:', data.value);
        return;
    }
    //const color = (val + 1) / 2 * 0xffffff;
    const color = 0xffffff;
    this.graphics.alpha = val+0.5;
    
    this.graphics.fill({ color: color, alpha: 0.5 });
   
    this.addChild(this.graphics);
     
  }
}