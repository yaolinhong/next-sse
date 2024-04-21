import { IncomingMessage, ServerResponse } from 'http';
import type { NextApiRequest, NextApiResponse } from 'next'

/**
 * 请求内对res对象操作 发送数据
 * https://www.rasukarusan.com/entry/2023/12/23/104646
 * @param res 
 */
const sendMsgInnerFunc = (res: NextApiResponse) => {
  const text = '夜空に広がる無数の星々の中、ひときわ明るく輝く星がありました。'

  let index = 0;
  const intervalId = setInterval(() => {
    if (index < text.length) {
      res.write(`data: ${text[index]}\n\n`);
      index++;
    } else {
      res.write(`data: [DONE]\n\n`); // ChatGPTっぽく終端文字を挿入
      clearInterval(intervalId);
      res.end();
    }
  }, 100);

}

// 用于存储连接的 Map
let broadcastMessage = '';
/**
 * map存储每个client是否已读
 * 全部已读清理消息 没有消息 不会触发发送消息机制；
 * 客户必须发送心跳 如果没有消息 长连接关闭
 */
const msgCenter = new Map<string, Boolean>();
const getMsg = () => broadcastMessage
let interval: NodeJS.Timeout



// 生成唯一的连接 ID
const generateId = () => {
  return Math.random().toString(36).slice(2);
};


// 处理事件流请求
const handleSSE = (req: IncomingMessage, res: NextApiResponse) => {
  // 检查请求头中是否包含 'Accept' 字段,且值为 'text/event-stream'
  if (req.headers.accept && req.headers.accept === 'text/event-stream') {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    // 添加这行之后即可
    res.setHeader('Content-Encoding', 'none');

    res.flushHeaders();

    const id = generateId();
    msgCenter.set(id, false);

    res.write(`data: ${id}登录啦 \n\n`);
    // let count = 0;
    const intervalId = setInterval(() => {
      if (!broadcastMessage) return
      const msg = `data: ${JSON.stringify({ message: getMsg(), time: new Date().getTime(), size: msgCenter.size })}\n\n`;
      if (msgCenter.get(id)) return;

      res.write(msg);
      console.log(`🚀 ~ intervalId ~ msg:${id}`, msg)

      msgCenter.set(id, true);
      let allSend = true
      msgCenter.forEach((_hasSend) => {
        if (!_hasSend) allSend = false

      })
      // 消息已经群发成功 清楚缓存的信息
      if (allSend) {
        broadcastMessage = ''
        msgCenter.forEach((hasSend, key) => {
          msgCenter.set(key, false)

          // 设置初始值 为下一条消息未发送状态
        })

      }
      // 另外给个 close的接口
      const shouldClose = false;
      if (shouldClose) {
        clearInterval(intervalId);
        res.end();

      }
      // count++;
      // if (count === 10) {
      //   console.log("🚀 ~ timmer ~ count:", count);
      // }
    }, 500);

    res.on('close', () => {
      console.log("🚀 ~ req.on ~ close:");
      clearInterval(intervalId);
      res.end();

    });

    res.on('error', (e) => {
      console.error("🚀 ~ res.on ~ e:", e);
      clearInterval(intervalId); res.end();

    });
    // res.on('error',(e)=>{})





  } else {
    console.error("如果不是 SSE 请求,返回 400 Bad Request")
    // 如果不是 SSE 请求,返回 400 Bad Request
    // res.status(400).json({ error: 'Invalid request' });
  }
};

// // 处理普通 POST 请求
const handlePost = (req: NextApiRequest, res: NextApiResponse) => {
  const body = req.body;
  const { message, count } = body;

  broadcastMessage = message

  // 监听客户端断开连接
  // req.on('close', () => {
  //   clearInterval(interval);
  // });
  // if (interval) {
  //   clearInterval(interval)

  //   // clients.clear()

  //   console.log("🚀 ~ interval ~ clearInterval:")
  // }

  // startSending();

  res.status(200).json({ message: 'OK' });
};

export default (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    // 如果是普通 POST 请求,处理并回复
    handlePost(req, res);
  } else {
    // 否则,检查是否是 SSE 请求
    handleSSE(req, res);
  }
};
