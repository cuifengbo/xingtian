/** 物品类型 */
declare type ItemType = "item" | "empty" | "map"; 

/** 物品状态 */
/** 正常 激活状态需要更新 */
/** 睡眠 非激活状态不需要更新 */
/** 死亡 不要移除，需要标记 */
declare type ItemStatus = "normal" | "sleep" | "dead";

/** 物品数据 */
declare type ItemData = {
  type: ItemType;
  position: {
    x: number;
    y: number;
  };
  age: number;
  status: ItemStatus;
};