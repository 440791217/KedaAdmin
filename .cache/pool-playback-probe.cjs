const http = require('http');
const fs = require('fs');
const root = 'D:/projects/KedaAdmin';
const html = `<!doctype html><meta charset="utf-8"><title>Camera playback regression</title><style>body{font:16px sans-serif;background:#edf2f8;padding:24px}video{width:640px;height:360px;background:#17212e}#status{white-space:pre-wrap}</style><h1>Camera playback regression</h1><p id="status">Running real browser MediaStream test...</p><div id="viewer"></div><script type="module">
import {TaskCameraPool} from '/pool.js';
const status=document.querySelector('#status'); const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const canvas=document.createElement('canvas');canvas.width=640;canvas.height=360;const ctx=canvas.getContext('2d');let t=0;
const timer=setInterval(()=>{ctx.fillStyle='#176b92';ctx.fillRect(0,0,640,360);ctx.fillStyle='#fff';ctx.font='30px sans-serif';ctx.fillText('Live frame '+(++t),40,100);ctx.fillRect((t*5)%600,180,35,35)},40);
const stream=canvas.captureStream(25);let opens=0,releases=0,tracks;
window.poolFixtures={resource:async()=>({data:{devices:[{id:'1',type_code:'camera',status:0,model_status:0}]}}),config:async()=>({data:{device_id:'1',frame_rates:{refresh_fps:0,detect_fps:2}}}),client:()=>({open:async()=>{opens++;return{session_id:'test'}},release:async()=>{releases++},heartbeat:async()=>({state:'ready'}),previewURL:()=>'/synthetic'}),reader:async()=>class{constructor(config){tracks=config;config.onTrack({track:stream.getVideoTracks()[0],streams:[stream]});config.onTrack({track:stream.getVideoTracks()[0],streams:[stream]});config.onTrack({track:{kind:'audio'},streams:[{}]})}close(){}}};
let pool;
try {
 pool=new TaskCameraPool('test');pool.plan('1',[{detection:{camera_id:'1'}}]);await pool.queue;
 const entry=pool.entries.get('1'); for(let i=0;i<80&&!pool.valid(entry);i++)await sleep(100);
 if(!pool.valid(entry))throw Error(entry.error||'no decoded frame');
 const viewer=document.querySelector('#viewer');entry.video.style.cssText='width:640px;height:360px';viewer.appendChild(entry.video);pool.play(entry);await sleep(400);
 const before=entry.video.getVideoPlaybackQuality().totalVideoFrames;
 for(let i=0;i<5;i++){pool.park(entry);await sleep(80);entry.video.style.cssText='width:640px;height:360px';viewer.appendChild(entry.video);pool.play(entry);await sleep(80);}
 const after=entry.video.getVideoPlaybackQuality().totalVideoFrames;
 if(after<=before||entry.video.paused||entry.error||opens!==1||releases!==0)throw Error(JSON.stringify({before,after,paused:entry.video.paused,error:entry.error,opens,releases}));
 status.textContent='PASS: real MediaStream decoded and continued playback.\\nDuplicate video/audio track events: no reload failure.\\nFive park/display moves: frames '+before+' → '+after+'.\\nCamera opens: '+opens+'; premature releases: '+releases+'.';
}catch(error){status.textContent='FAIL: '+error.message}
window.addEventListener('pagehide',()=>{clearInterval(timer);stream.getTracks().forEach(t=>t.stop());if(pool)pool.close()});
</script>`;
http.createServer((req,res)=>{if(req.url==='/pool.js'){res.setHeader('Content-Type','text/javascript');const source=fs.readFileSync(root+'/src/utils/task-camera-pool.js','utf8').replace(/^import .*\r?\n/gm,'');res.end('const fetchResource=(...a)=>window.poolFixtures.resource(...a);const fetchCameraCaptureConfig=(...a)=>window.poolFixtures.config(...a);const createCaptureClient=(...a)=>window.poolFixtures.client(...a);const loadCaptureReader=(...a)=>window.poolFixtures.reader(...a);\n'+source);}else{res.setHeader('Content-Type','text/html;charset=utf-8');res.end(html)}}).listen(18094,'127.0.0.1');
