import { GameScreen } from "../GameScreen";
import { engine } from "../../../getEngine";
import gameDataModel from "../GameDataModel";

class Controller {
  private gameScreen: GameScreen;
  private pressedKeys: Set<string> = new Set();
  private currentZoomCommand: string | null = null;
  private clearZoomTimeout: ReturnType<typeof setTimeout> | null = null;

  // 键盘加速相关
  private keyPressTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private keyPressStartTime: Map<string, number> = new Map();
  private currentSpeedCommand: Map<string, string> = new Map();
  private maxSpeedFactor = 12.0;
  private acceleration = 5.0;

  // 边缘移动加速相关
  private edgeDirection: 'left' | 'right' | 'up' | 'down' | null = null;
  private edgeMoveTimer: ReturnType<typeof setTimeout> | null = null;
  private edgeStartTime: number = 0;
  private edgeSpeedFactor: number = 0;
  private edgeAcceleration = 5.0;
  private edgeMaxSpeedFactor = 12.0;
  private edgeStepBase = 1;

  // 事件绑定引用
  private boundMoveHandler: (event: PointerEvent) => void;
  private boundWheelHandler: (event: WheelEvent) => void;
  private boundKeyDown: (event: KeyboardEvent) => void;
  private boundKeyUp: (event: KeyboardEvent) => void;
  private boundWindowMouseLeave: () => void;
  private boundCanvasMouseLeave: () => void;  // 新增：画布离开监听

  constructor(gameScreen: GameScreen) {
    this.gameScreen = gameScreen;
    this.boundMoveHandler = this.onPointerMove.bind(this);
    this.boundWheelHandler = this.handleWheel.bind(this);
    this.boundKeyDown = this.onKeyDown.bind(this);
    this.boundKeyUp = this.onKeyUp.bind(this);
    this.boundWindowMouseLeave = this.onWindowMouseLeave.bind(this);
    this.boundCanvasMouseLeave = this.onCanvasMouseLeave.bind(this);
    this.init();
  }

  private init() {
    console.log("Controller initialized");

    this.gameScreen.on("pointerdown", () => {
      console.log("pointerdown");
    });

    this.gameScreen.on("pointermove", this.boundMoveHandler);
    this.gameScreen.on("wheel", this.boundWheelHandler);
    window.addEventListener("keydown", this.boundKeyDown);
    window.addEventListener("keyup", this.boundKeyUp);
    window.addEventListener("mouseleave", this.boundWindowMouseLeave);

    console.log("engine().canvas:", engine().canvas);
    // 监听画布元素的 mouseleave 事件（鼠标离开游戏区域即停止移动）
    const canvas = engine().canvas as unknown as HTMLCanvasElement; // 根据实际渲染器获取 canvas 元素
    if (canvas) {
      (canvas as unknown as HTMLCanvasElement).addEventListener("mouseleave", this.boundCanvasMouseLeave);
    }
  }

  // ==================== 鼠标/触摸边缘加速移动 ====================
  private onPointerMove(event: PointerEvent) {
    const mouseX = event.clientX / engine().screen.width;
    const mouseY = event.clientY / engine().screen.height;

    let newDirection: typeof this.edgeDirection = null;
    if (mouseX < 0.1) newDirection = 'left';
    else if (mouseX > 0.9) newDirection = 'right';
    else if (mouseY < 0.1) newDirection = 'up';
    else if (mouseY > 0.9) newDirection = 'down';

    if (newDirection !== this.edgeDirection) {
      if (newDirection === null) {
        this.stopEdgeMove();
      } else {
        this.startEdgeMove(newDirection);
      }
      this.edgeDirection = newDirection;
    }
  }

  private startEdgeMove(direction: 'left' | 'right' | 'up' | 'down') {
    this.stopEdgeMove();
    this.edgeDirection = direction;
    this.edgeStartTime = performance.now();
    this.edgeSpeedFactor = 0;
    this.runEdgeMove();
  }

  private runEdgeMove() {
    if (this.edgeDirection === null) return;

    const now = performance.now();
    const duration = (now - this.edgeStartTime) / 1000;
    let factor = this.edgeAcceleration * duration;
    factor = Math.min(this.edgeMaxSpeedFactor, factor);
    this.edgeSpeedFactor = factor;

    const step = this.edgeStepBase * (1 + factor);
    const camera = gameDataModel.getCamera();
    switch (this.edgeDirection) {
      case 'left':  camera.x -= step; break;
      case 'right': camera.x += step; break;
      case 'up':    camera.y -= step; break;
      case 'down':  camera.y += step; break;
    }

    this.edgeMoveTimer = setTimeout(() => this.runEdgeMove(), 16);
  }

  private stopEdgeMove() {
    if (this.edgeMoveTimer !== null) {
      clearTimeout(this.edgeMoveTimer);
      this.edgeMoveTimer = null;
    }
    this.edgeDirection = null;
    this.edgeSpeedFactor = 0;
  }

  private onWindowMouseLeave() {
    this.stopEdgeMove();
  }

  private onCanvasMouseLeave() {
    // 鼠标离开游戏画布区域时立即停止边缘移动
    this.stopEdgeMove();
  }

  // ==================== 键盘加速控制 ====================
  private onKeyDown(event: KeyboardEvent) {
    const key = event.key;
    if (this.pressedKeys.has(key)) return;
    this.pressedKeys.add(key);
    this.keyPressStartTime.set(key, Date.now());
    this.startKeySpeedUpdate(key);
  }

  private startKeySpeedUpdate(key: string) {
    const update = () => {
      if (!this.pressedKeys.has(key)) return;
      const startTime = this.keyPressStartTime.get(key)!;
      const duration = (Date.now() - startTime) / 1000;
      let factor = this.acceleration * duration;
      factor = Math.min(this.maxSpeedFactor, factor);
      const newCommand = `${key}_${factor.toFixed(2)}`;
      const oldCommand = this.currentSpeedCommand.get(key);
      if (oldCommand !== newCommand) {
        if (oldCommand) {
          const idx = gameDataModel.currentCommand.indexOf(oldCommand);
          if (idx !== -1) gameDataModel.currentCommand.splice(idx, 1);
        }
        gameDataModel.currentCommand.push(newCommand);
        this.currentSpeedCommand.set(key, newCommand);
      }
      const timerId = setTimeout(update, 16);
      this.keyPressTimers.set(key, timerId);
    };
    update();
  }

  private onKeyUp(event: KeyboardEvent) {
    const key = event.key;
    this.pressedKeys.delete(key);
    const timerId = this.keyPressTimers.get(key);
    if (timerId) {
      clearTimeout(timerId);
      this.keyPressTimers.delete(key);
    }
    const speedCmd = this.currentSpeedCommand.get(key);
    if (speedCmd) {
      const idx = gameDataModel.currentCommand.indexOf(speedCmd);
      if (idx !== -1) gameDataModel.currentCommand.splice(idx, 1);
      this.currentSpeedCommand.delete(key);
    }
    this.keyPressStartTime.delete(key);
  }

  // ==================== 滚轮缩放控制 ====================
  private handleWheel(event: WheelEvent) {
    event.preventDefault();
    if (this.clearZoomTimeout) clearTimeout(this.clearZoomTimeout);
    
    const mouseX = event.clientX / engine().screen.width;
    const mouseY = event.clientY / engine().screen.height;
    
    let newCommand: string | null = null;
    if (event.deltaY < 0) {
      newCommand = `zoomin_${event.deltaY}_${mouseX}_${mouseY}`;
    } else if (event.deltaY > 0) {
      newCommand = `zoomout_${event.deltaY}_${mouseX}_${mouseY}`;
    }
    if (newCommand !== this.currentZoomCommand) {
      if (this.currentZoomCommand) {
        const idx = gameDataModel.currentCommand.indexOf(this.currentZoomCommand);
        if (idx !== -1) gameDataModel.currentCommand.splice(idx, 1);
      }
      if (newCommand && !gameDataModel.currentCommand.includes(newCommand)) {
        gameDataModel.currentCommand.push(newCommand);
      }
      this.currentZoomCommand = newCommand;
    }
    this.clearZoomTimeout = setTimeout(() => {
      if (this.currentZoomCommand) {
        const idx = gameDataModel.currentCommand.indexOf(this.currentZoomCommand);
        if (idx !== -1) gameDataModel.currentCommand.splice(idx, 1);
        this.currentZoomCommand = null;
      }
      this.clearZoomTimeout = null;
    }, 100);
  }

  // ==================== 清理资源 ====================
  public destroy() {
    this.gameScreen.off("pointerdown");
    this.gameScreen.off("pointermove", this.boundMoveHandler);
    this.gameScreen.off("wheel", this.boundWheelHandler);
    window.removeEventListener("keydown", this.boundKeyDown);
    window.removeEventListener("keyup", this.boundKeyUp);
    window.removeEventListener("mouseleave", this.boundWindowMouseLeave);

    const canvas = engine().canvas as unknown as HTMLCanvasElement;
    if (canvas) {
      (canvas as unknown as HTMLCanvasElement).removeEventListener("mouseleave", this.boundCanvasMouseLeave);
    }

    this.stopEdgeMove();
    for (const timerId of this.keyPressTimers.values()) clearTimeout(timerId);
    this.keyPressTimers.clear();
    if (this.clearZoomTimeout) clearTimeout(this.clearZoomTimeout);
    for (const cmd of this.currentSpeedCommand.values()) {
      const idx = gameDataModel.currentCommand.indexOf(cmd);
      if (idx !== -1) gameDataModel.currentCommand.splice(idx, 1);
    }
    if (this.currentZoomCommand) {
      const idx = gameDataModel.currentCommand.indexOf(this.currentZoomCommand);
      if (idx !== -1) gameDataModel.currentCommand.splice(idx, 1);
    }
    console.log("Controller destroyed");
  }
}

export default Controller;