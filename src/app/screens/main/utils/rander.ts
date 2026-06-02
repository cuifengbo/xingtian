import { baseConfig } from "../../../baseConfig";
 
import { engine } from "../../../getEngine";
import gameDataModel from "../GameDataModel";

export const rander = (target: any) => {
   
  // 计算item的实际位置
  target.x = target.data.position.x * baseConfig.defaultCellSize * gameDataModel.getCamera().zoom;
  target.y = target.data.position.y * baseConfig.defaultCellSize * gameDataModel.getCamera().zoom;
  
  // 计算item的实际位置相对于camera的位置
  // target.x = target.x - gameDataModel.getCamera().x ;
  // target.y = target.y - gameDataModel.getCamera().y ;

  // // // 应用屏幕位置映射
  // const screenWidth = engine().screen.width;
  // const screenHeight = engine().screen.height;


  // target.x = target.x + screenWidth / 2 //+ gameDataModel.getCamera().x * gameDataModel.getCamera().zoom;
  // target.y = target.y + screenHeight / 2 //+ gameDataModel.getCamera().y * gameDataModel.getCamera().zoom;

  // 设置item的缩放
  target.scale.set(gameDataModel.getCamera().zoom);
}