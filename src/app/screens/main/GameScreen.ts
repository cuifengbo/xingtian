import { FancyButton } from "@pixi/ui";
import { animate } from "motion";
import type { AnimationPlaybackControls } from "motion/react";
import type { Ticker } from "pixi.js";
import { Container } from "pixi.js";

import { engine } from "../../getEngine";
import { PausePopup } from "../../popups/PausePopup";
import { SettingsPopup } from "../../popups/SettingsPopup";
import { Button } from "../../ui/Button";


import { MapItem } from "./compents/MapItem";
import { MainScreen } from "./MainScreen";
import { baseConfig } from "../../baseConfig";
import { baseData } from "../../baseData";

import Controller from "./utils/controller";
import debuger from "./Debuger";
import gameDataModel from "./GameDataModel";

import worker from '../../../workres/worker.js?worker';

/** The screen that holds the app */
export class GameScreen extends Container {
  /** Assets bundles required by this screen */
  public static assetBundles = ["main"];

  public mainContainer: Container; // 主容器
  public mapContainer: Container; // 地图容器
  private pauseButton: FancyButton;
  private settingsButton: FancyButton;
  private addButton: FancyButton;
  private removeButton: FancyButton;

  private paused = false;

  private randerList: Array<any> = []; // 渲染列表
  private dataList: Array<any> = []; // 实际数据列表

  private controller: Controller;
  private worker: Worker;
  constructor() {
    super();

    this.initCamera();
    this.worker = new worker();

    this.controller = new Controller(this);

    this.interactive = true;

    this.worker.onmessage = (event) => {
      const { type, payload, id } = event.data;
      if (type === 'yw') {
        // 执行业务逻辑（例如更新 UI）
        
        switch (payload.type) {
          case 'genMap':
             
            this.initMap(payload.map);
            break;
          default:
            break;
        }
        // 处理完成后回复 ACK
        this.worker.postMessage({ type: 'ack', id });
      }
    };
    console.log('发送消息', this.worker.postMessage);

    this.worker.postMessage({
      type: 'yw', payload: {
        type: 'genMap',
        payload: {
          width: 100,
          height: 100,
          seed: 123456,
        }
      }
    });
    this.mainContainer = new Container();
    this.mapContainer = new Container();

    this.mainContainer.addChild(this.mapContainer);
    this.addChild(this.mainContainer);

    const buttonAnimations = {
      hover: {
        props: {
          scale: { x: 1.1, y: 1.1 },
        },
        duration: 100,
      },
      pressed: {
        props: {
          scale: { x: 0.9, y: 0.9 },
        },
        duration: 100,
      },
    };
    this.pauseButton = new FancyButton({
      defaultView: "icon-pause.png",
      anchor: 0.5,
      animations: buttonAnimations,
    });
    this.pauseButton.onPress.connect(() =>
      engine().navigation.presentPopup(PausePopup),
    );
    this.addChild(this.pauseButton);

    this.settingsButton = new FancyButton({
      defaultView: "icon-settings.png",
      anchor: 0.5,
      animations: buttonAnimations,
    });
    this.settingsButton.onPress.connect(() =>
      engine().navigation.presentPopup(SettingsPopup),
    );
    this.addChild(this.settingsButton);

    this.addButton = new Button({
      text: "Add",
      width: 175,
      height: 110,
    });
    this.addButton.onPress.connect(() => {
      console.log('cthis.mainContainer',this.mainContainer);
    });
    this.addChild(this.addButton);

    this.removeButton = new Button({
      text: "Remove",
      width: 175,
      height: 110,
    });
    this.removeButton.onPress.connect(() => {
      engine().navigation.showScreen(MainScreen);

    });
    this.addChild(this.removeButton);
  }

  private async initMap(map: any) { // 初始化地图
    //   const map = await mapGen();
    console.log('map', map);
    map.forEach((row: any, rowIndex: number) => {
      row.forEach((item: any, colIndex: number) => {
        this.dataList.push(item);
      });
    });

    
    this.dataList.forEach((item) => {
      const mapItem = new MapItem(item);
      this.randerList.push(mapItem);
       this.mapContainer.addChild(mapItem);
    });


    // 添加调试器
    this.addChild(debuger);
  }

  private initCamera() {
    baseData.camera.x = baseConfig.defauleStartX;
    baseData.camera.y = baseConfig.defauleStartY;
    baseData.camera.zoom = baseConfig.zoomDefault;
  }

  /** Prepare the screen just before showing */
  public prepare() { }

  /** Update the screen */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public update(_time: Ticker) {
    if (this.paused) return;

    this.randerList.forEach((item) => {
      item.updateUI();
    });
    gameDataModel.update();
    debuger.update();
   // this.mainContainer.position.set(-gameDataModel.getCamera().x + engine().screen.width/2, -gameDataModel.getCamera().y + engine().screen.height/2);
    this.mainContainer.scale.set(gameDataModel.getCamera().zoom);
  }

  /** Pause gameplay - automatically fired when a popup is presented */
  public async pause() {
    this.mainContainer.interactiveChildren = false;
    this.paused = true;
  }

  /** Resume gameplay */
  public async resume() {
    this.mainContainer.interactiveChildren = true;
    this.paused = false;
  }

  /** Fully reset */
  public reset() { }

  /** Resize the screen, fired whenever window size changes */
  public resize(width: number, height: number) {
    const centerX = width * 0.5;
    const centerY = height * 0.5;

    // this.mainContainer.x = centerX;
    // this.mainContainer.y = centerY;
    this.pauseButton.x = 30;
    this.pauseButton.y = 430;
    this.settingsButton.x = width - 30;
    this.settingsButton.y = 30;
    this.removeButton.x = width / 2 - 100;
    this.removeButton.y = height - 75;
    this.addButton.x = width / 2 + 100;
    this.addButton.y = height - 75;


  }

  /** Show screen with animations */
  public async show(): Promise<void> {
    engine().audio.bgm.play("main/sounds/bgm-main.mp3", { volume: 0.5 });

    const elementsToAnimate = [
      this.pauseButton,
      this.settingsButton,
      this.addButton,
      this.removeButton,
    ];

    let finalPromise!: AnimationPlaybackControls;
    for (const element of elementsToAnimate) {
      element.alpha = 0;
      finalPromise = animate(
        element,
        { alpha: 1 },
        { duration: 0.3, delay: 0.75, ease: "backOut" },
      );
    }

    await finalPromise;

  }

  /** Hide screen with animations */
  public async hide() { }

  /** Auto pause the app when window go out of focus */
  public blur() {
    if (!engine().navigation.currentPopup) {
      engine().navigation.presentPopup(PausePopup);
    }
  }
}
