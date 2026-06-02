import { MapItem } from "./compents/MapItem";
import { baseConfig } from "../../baseConfig";
import { engine } from "../../getEngine";
enum GameStatus {
  START = "start",
  RUNNING = "running",
  PAUSED = "paused",
  GAMEOVER = "gameover",
  VICTORY = "victory",
}

class GameDataModel {
  private status: GameStatus = GameStatus.START;
  private map: MapItem[][] = [];
  private camera: {x: number, y: number, zoom: number} = {x: 0, y: 0, zoom: 1};
  public currentCommand: string[] = [];

  constructor() {
    this.status = GameStatus.START;
    this.currentCommand = [];
  }

  public update() {
    
    this.currentCommand.forEach(command => {
      const commandArray = command.split("_");
      const commandType = commandArray[0];
      const commandValue = commandArray[1];
      switch (commandType) {
        case "w":
          this.camera.y -= Number(commandValue) * baseConfig.defaultCellSize * gameDataModel.getCamera().zoom;
          break;
        case "s":
          this.camera.y += Number(commandValue) * baseConfig.defaultCellSize * gameDataModel.getCamera().zoom;
          break;
        case "a":
          this.camera.x -= Number(commandValue) * baseConfig.defaultCellSize * gameDataModel.getCamera().zoom;
          break;
        case "d":
          this.camera.x += Number(commandValue) * baseConfig.defaultCellSize * gameDataModel.getCamera().zoom;
          break;
        case "zoomin":
          {
            const zoomDelta = Math.abs(Number(commandValue)) / 1000;
            const targetZoom = this.camera.zoom + zoomDelta;
            const actualZoom = Math.min(targetZoom, baseConfig.zoomMax);
            
            // 如果有鼠标位置参数，以鼠标位置为中心缩放
            if (commandArray.length >= 4) {
              const mouseX = Number(commandArray[2]);
              const mouseY = Number(commandArray[3]);
              
              // 计算鼠标在世界空间的位置（使用当前 zoom）
              const worldX = this.camera.x + (mouseX - 0.5) * engine().screen.width / this.camera.zoom;
              const worldY = this.camera.y + (mouseY - 0.5) * engine().screen.height / this.camera.zoom;
              
              // 调整相机位置，使鼠标位置在缩放后保持不变
              this.camera.x = worldX - (mouseX - 0.5) * engine().screen.width / actualZoom;
              this.camera.y = worldY - (mouseY - 0.5) * engine().screen.height / actualZoom;
            }
            
            this.camera.zoom = actualZoom;
          }
          break;
        case "zoomout":
          {
            const zoomDelta = Math.abs(Number(commandValue)) / 1000;
            const targetZoom = this.camera.zoom - zoomDelta;
            const actualZoom = Math.max(targetZoom, baseConfig.zoomMin);
            
            // 如果有鼠标位置参数，以鼠标位置为中心缩放
            if (commandArray.length >= 4) {
              const mouseX = Number(commandArray[2]);
              const mouseY = Number(commandArray[3]);
              
              // 计算鼠标在世界空间的位置（使用当前 zoom）
              const worldX = this.camera.x + (mouseX - 0.5) * engine().screen.width / this.camera.zoom;
              const worldY = this.camera.y + (mouseY - 0.5) * engine().screen.height / this.camera.zoom;
              
              // 调整相机位置，使鼠标位置在缩放后保持不变
              this.camera.x = worldX - (mouseX - 0.5) * engine().screen.width / actualZoom;
              this.camera.y = worldY - (mouseY - 0.5) * engine().screen.height / actualZoom;
            }
            
            this.camera.zoom = actualZoom;
          }
          break;
        default:
          break;
      }
    });
  }

  public getStatus() {
    return this.status;
  }

  public setStatus(status: GameStatus) {
    this.status = status;
  }
  public getCamera() {
    return this.camera;
  }
}

const gameDataModel = new GameDataModel();

export default gameDataModel;