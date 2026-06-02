import { MapItem } from "./compents/MapItem";
import { baseConfig } from "../../baseConfig";
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
      console.log("commandType:", commandType);
      console.log("commandValue:", commandValue);
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
          console.log("zoomin_", commandValue);
          if(this.camera.zoom < baseConfig.zoomMax) {
            this.camera.zoom -= Number(commandValue) / 1000;  
          }
          if(this.camera.zoom > baseConfig.zoomMax) {
            this.camera.zoom = baseConfig.zoomMax;
          }
          break;
        case "zoomout":
          if(this.camera.zoom > baseConfig.zoomMin) {
            this.camera.zoom -= Number(commandValue) / 1000;
          }
          if(this.camera.zoom < baseConfig.zoomMin) {
            this.camera.zoom = baseConfig.zoomMin;
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