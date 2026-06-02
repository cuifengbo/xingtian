// worker.js worker 主体
import { mapgen } from './mapgen';
const MESSAGE_TYPE_YW = 'yw';
const MESSAGE_TYPE_ACK = 'ack';
 
const ACK_TIMEOUT = 5000;   // 5 秒超时
const MAX_RETRIES = 3;

let nextId = 0;
let pending = new Map();          // id -> { message, retryCount, timer }
let messageQueue = [];            // 待发送的消息队列（先进先出）
let sending = false;              // 是否正在等待 ACK

self.onerror = (error) => {
    console.error('Worker 内部错误:', error);
    self.postMessage({ type: 'error', error: error.message });
};

// 发送下一条消息（如果没有正在等待的）
function sendNext() {
    if (sending) return;
    if (messageQueue.length === 0) return;
    const msg = messageQueue.shift();
    const id = msg.id;
    const timer = setTimeout(() => onTimeout(id), ACK_TIMEOUT);
    pending.set(id, { message: msg, retryCount: 0, timer });
    self.postMessage({ type: msg.type, payload: msg.payload, id });
    sending = true;
}

// 超时重传
function onTimeout(id) {
    const entry = pending.get(id);
    if (!entry) return;
    if (entry.retryCount < MAX_RETRIES) {
        entry.retryCount++;
        console.warn(`消息 ${id} 超时，重试 ${entry.retryCount}/${MAX_RETRIES}`);
        // 重新发送
        self.postMessage({ type: entry.message.type, payload: entry.message.payload, id });
        // 重置定时器
        clearTimeout(entry.timer);
        entry.timer = setTimeout(() => onTimeout(id), ACK_TIMEOUT);
        pending.set(id, entry);
    } else {
        console.error(`消息 ${id} 超过最大重试次数，丢弃`);
        clearTimeout(entry.timer);
        pending.delete(id);
        sending = false;
        sendNext(); // 继续下一条
    }
}

// 收到主线程 ACK
self.onmessage = (event) => {
   
    const data = event.data;
    if (data.type === MESSAGE_TYPE_ACK) {
        const id = data.id;
        const entry = pending.get(id);
        if (entry) {
            clearTimeout(entry.timer);
            pending.delete(id);
            sending = false;
            sendNext();   // 发送下一条
        }
        return;
    }
    // 其他消息（例如主线程请求发送业务消息）
    if (data.type === MESSAGE_TYPE_YW) {
       
        const message = {
            type: MESSAGE_TYPE_YW,
            payload: data.payload,
            id: nextId++
        };
        if(data.payload.type === 'genMap') {
             
            const map = mapgen.generateMap(data.payload.payload.width, data.payload.payload.height, data.payload.payload.seed);
            message.payload.map = map;
        }
        messageQueue.push(message);
        sendNext();
    }
};