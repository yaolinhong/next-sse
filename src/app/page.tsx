'use client'


import { useEffect, useState } from "react";



// 建立 EventSource 连接


export default function Home() {
  const [data,setData] = useState(['test'])
  const [msg,setMsg] = useState('hello')
  const sendReq = ()=> fetch(window.origin+'/api/sse', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: msg,
      count: 1 // 每 5 秒推送一次消息
    })
  });
  function connetEventSource() {
    const eventSource = new EventSource(window.origin+'/api/sse');
    console.log("here")
    eventSource.onmessage = (event) => {
      console.log('Received message from server:', event.data);
      // setData([...data,event.data])
    };
    
    eventSource.addEventListener('message',(e) => {
      
      console.log("🚀 ~ message", e)
    })
    eventSource.addEventListener('open',(e) => {
      console.log("🚀 ~ open", e)
    })
    // eventSource.addEventListener('')
    eventSource.onerror = (e) => {
      // server close connnect 也会触发这个回调
      console.log("🚀 ~ onerror:", e)
      eventSource.close()
      
    }; 
  
    
  }
  
  function handlerMsg(e:any) {
    console.log("🚀 ~ handlerMsg ~ params:", e)
    setMsg(e.target.value)
    
  }
  useEffect(()=>{
    // 这里 开发环境执行两次
    
 
  // 发送 POST 请求
  // sendReq();



},[])


  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      {data.map(item=>item)}

<input className=" text-red-400 " type="text" onChange={handlerMsg}/>

      <button className="" onClick={()=>sendReq()}>sendReq</button>
      <button className="" onClick={()=>connetEventSource()}>connetEventSource</button>
    </main>
  );
}
