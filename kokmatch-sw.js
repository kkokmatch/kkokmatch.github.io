self.addEventListener('install',event=>{self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(self.clients.claim())});

self.addEventListener('push',event=>{
  let payload={};
  try{payload=event.data?event.data.json():{}}catch{try{payload={body:event.data?.text?.()||''}}catch{payload={}}}
  const title=payload.title||'콕매치';
  const options={
    body:payload.body||'게임 알림이 도착했습니다.',
    tag:payload.tag||('kokmatch-'+Date.now()),
    renotify:true,
    requireInteraction:true,
    silent:false,
    data:payload.data||{},
    timestamp:Date.now()
  };
  event.waitUntil((async()=>{
    const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of clients){try{client.postMessage({type:'KOKMATCH_PUSH_RECEIVED',payload:{title,body:options.body,tag:options.tag,data:options.data}})}catch{}}
    await self.registration.showNotification(title,options);
  })());
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const data=event.notification.data||{};
  const view=data.view||'';
  event.waitUntil((async()=>{
    const list=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    if(list.length){
      const client=list[0];
      try{await client.focus()}catch{}
      try{client.postMessage({type:'KOKMATCH_PUSH_CLICK',view,data})}catch{}
      return;
    }
    const q=view?'?pushView='+encodeURIComponent(view):'';
    await self.clients.openWindow('/'+q);
  })());
});
