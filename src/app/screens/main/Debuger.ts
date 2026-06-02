import { Container, Graphics, Text, TextStyle } from "pixi.js";
import config from "../../../config";
import {baseData} from "../../baseData";
import gameDataModel from "./GameDataModel";

export class Debuger extends Container {
  private graphics: Graphics;
  private text: Text;
  public camera: {x: number, y: number, scale: number};
  public center: {x: number, y: number};
  public currentCommand: string[];

  constructor() {
    super();
    this.graphics = new Graphics();
    this.graphics.rect(0, 0, 300, 400);
    this.graphics.fill(0x000000);
  
    // 创建文本对象
    const textStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 14,
      fill: 0xffffff, // 白色文字
      align: 'left',
    });
    
    this.text = new Text({
      text: '',
      style: textStyle
    });
    
    // 设置文本位置
    this.text.x = 10;
    this.text.y = 10;
    
    this.addChild(this.graphics);
    this.addChild(this.text);
    
    this.camera = {x: 0, y: 0, scale: 1};
    this.center = {x: 0, y: 0};
    this.currentCommand = [];
    this.update();
  }

  public update() {
    this.camera.x = gameDataModel.getCamera().x;
    this.camera.y = gameDataModel.getCamera().y;
    this.camera.scale = gameDataModel.getCamera().zoom;
    this.currentCommand = gameDataModel.currentCommand;

    // 更新文本内容
    const textContent = 
      `Camera:\nx: ${this.camera.x.toFixed(2)}\ny: ${this.camera.y.toFixed(2)}\nscale: ${this.camera.scale.toFixed(2)}\n\n` +
      `Center:\nx: ${this.center.x.toFixed(2)}\ny: ${this.center.y.toFixed(2)}\n\n` +
      `Current Input:\n${this.currentCommand}`;

    this.text.text = textContent;
  }
}

const debuger = new Debuger();
export default debuger;