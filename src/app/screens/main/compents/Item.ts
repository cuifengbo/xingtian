import { Container } from "pixi.js";

import { rander } from "../utils/rander";

export class Item extends Container {
  protected data: ItemData;

  constructor(data: ItemData) {
    super();
    this.data = data;
  }
  public updateUI() {
    rander(this);
  }
}