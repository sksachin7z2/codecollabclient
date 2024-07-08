import React,{useState,useEffect,useRef} from 'react'
import Avatar from 'react-avatar';
import { useLocation ,useNavigate} from 'react-router-dom';
import axios from "axios";
import {BsFillDoorOpenFill} from 'react-icons/bs'

import AceEditor from "react-ace";
import io from "socket.io-client"
import queryString from 'query-string'
import Message from './Message';
import SimplePeer from 'simple-peer';
import Spinner from './Spinner';
import "ace-builds/src-noconflict/mode-c_cpp";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/mode-python";
import   "ace-builds/src-noconflict/mode-ruby";
import "ace-builds/src-noconflict/mode-php";
import "ace-builds/src-noconflict/mode-golang";
import "ace-builds/src-noconflict/mode-csharp";
import "ace-builds/src-noconflict/mode-typescript";

import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/theme-tomorrow";
import "ace-builds/src-noconflict/theme-kuroir";
import "ace-builds/src-noconflict/theme-twilight";
import "ace-builds/src-noconflict/theme-xcode";
import "ace-builds/src-noconflict/theme-textmate";
import "ace-builds/src-noconflict/theme-solarized_dark";
import "ace-builds/src-noconflict/theme-solarized_light";
import "ace-builds/src-noconflict/theme-terminal";




import "ace-builds/src-noconflict/ext-language_tools";
import Editornav from './Editornav';
import Container from './whiteboard/container/Container'


let socket;
let localStream = null;
let peers = {}

function Room({notify}) {
  const [colormic, setColormic] = useState('red')
  const [colorvid, setColorvid] = useState('green')
  const [helppeers, sethelpPeers] = useState(true)
  let muteButton=document.getElementById("muteButton")
let videos=document.getElementById("videos")
let localVideo=document.getElementById("localVideo");
let vidButton=document.getElementById("vidButton")
const [loading, setLoading] = useState(false)
  
  let navigate=useNavigate();
  let location=useLocation();
  
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [users, setUsers] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  
  const [source, setSource] = useState("");
  const [inp, setInp] = useState("");
  const [langid, setLangid] = useState(63);
  const [stdoutt, setStdo] = useState("");
  const [contri, setContri] = useState(false)

const [help, sethelp] = useState(true)

  const configuration = {
 
    "iceServers": [
    {
      urls: "stun:openrelay.metered.ca:80"
    },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject"
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject"
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject"
    }
  ]
}

/**
 * UserMedia constraints
 */

  let constraints = {
    audio: true,
    video: {
      facingMode: {
        ideal: "user"
    },
        width: {
            max: 100
        },
        height: {
            max: 100
        }
    }}
  
  
  
   
const ENDPOINT="http://localhost:5000";
// const ENDPOINT="https://codecollab7z2.onrender.com";

function removePeer(socket_id) {
console.log(socket_id,"hjbh")
  let videoEl = document.getElementById(socket_id)
  if (videoEl) {

      const tracks = videoEl.srcObject.getTracks();

      tracks.forEach(function (track) {
          track.stop()
      })

      videoEl.srcObject = null
      videoEl.parentNode.removeChild(videoEl)
  }
  if (peers[socket_id]) peers[socket_id].destroy()
  delete peers[socket_id]
}

/**
* Creates a new peer connection and sets the event listeners

*                  Set to true if the peer initiates the connection process.
*                  Set to false if the peer receives the connection. 
*/
function addPeer(socket_id, am_initiator) {
  console.log("enter added");
  peers[socket_id] = new SimplePeer({
      initiator: am_initiator,
      stream: localStream,
      config: configuration
  });

  peers[socket_id].on('signal', data => {

      socket.emit('signal', {
          signal: data,
          socket_id: socket_id
      })
  });
console.log(peers,socket_id);
peers[socket_id].on('stream', stream => {
  console.log("urh")
  // sethelp(!help)
    let newVid = document.createElement('video')
let videos=document.getElementById("videos")

    newVid.srcObject = stream
    newVid.id = socket_id
    newVid.playsinline = false
    newVid.autoplay = true
    newVid.muted=true
    newVid.className = "vid"
    newVid.onclick = () => openPictureMode(newVid)
    newVid.ontouchstart = (e) => openPictureMode(newVid)
    console.log(newVid);
    videos.appendChild(newVid)
    
  })
}

/**
* Opens an element in Picture-in-Picture mode
* @param {HTMLVideoElement} el video element to put in pip mode
*/
function openPictureMode(el) {
  console.log('opening pip')
  el.requestPictureInPicture()
}

/**
* Switches the camera between user and environment. It will just enable the camera 2 cameras not supported.
*/
function switchMedia() {
  if (constraints.video.facingMode.ideal === 'user') {
      constraints.video.facingMode.ideal = 'environment'
  } else {
      constraints.video.facingMode.ideal = 'user'
  }

  const tracks = localStream.getTracks();

  tracks.forEach(function (track) {
      track.stop()
  })

  localVideo.srcObject = null
  navigator.mediaDevices.getUserMedia(constraints).then(stream => {

      for (let socket_id in peers) {
          for (let index in peers[socket_id].streams[0].getTracks()) {
              for (let index2 in stream.getTracks()) {
                  if (peers[socket_id].streams[0].getTracks()[index].kind === stream.getTracks()[index2].kind) {
                      peers[socket_id].replaceTrack(peers[socket_id].streams[0].getTracks()[index], stream.getTracks()[index2], peers[socket_id].streams[0])
                      break;
                  }
              }
          }
      }

      localStream = stream
      localVideo.srcObject = stream

      updateButtons()
  })
}

/**
* Enable screen share
*/
function setScreen() {
  navigator.mediaDevices.getDisplayMedia().then(stream => {
      for (let socket_id in peers) {
          for (let index in peers[socket_id].streams[0].getTracks()) {
              for (let index2 in stream.getTracks()) {
                  if (peers[socket_id].streams[0].getTracks()[index].kind === stream.getTracks()[index2].kind) {
                      peers[socket_id].replaceTrack(peers[socket_id].streams[0].getTracks()[index], stream.getTracks()[index2], peers[socket_id].streams[0])
                      break;
                  }
              }
          }

      }
      localStream = stream

      localVideo.srcObject = localStream
      socket.emit('removeUpdatePeer', '')
  })
  updateButtons()
}

/**
* Disables and removes the local stream and all the connections to other peers.
*/
function removeLocalStream() {
  if (localStream) {
      const tracks = localStream.getTracks();

      tracks.forEach(function (track) {
          track.stop()
      })

      localVideo.srcObject = null
  }

  for (let socket_id in peers) {
      removePeer(socket_id)
  }
}

/**
* Enable/disable microphone
*/
function toggleMute() {
//   for (let index in localStream.getAudioTracks()) {
//     localStream.getAudioTracks()[index].enabled = !localStream.getAudioTracks()[index].enabled 
    
// }
  localVideo.muted=!localVideo.muted
  localVideo.muted?setColormic('red'):setColormic('green')
  
}
/**
* Enable/disable video
*/
function toggleVid() {
  for (let index in localStream.getVideoTracks()) {
      localStream.getVideoTracks()[index].enabled = !localStream.getVideoTracks()[index].enabled
      localStream.getVideoTracks()[index].enabled?setColorvid('green'):setColorvid('red')
  }
}

/**
* updating text of buttons
*/
function updateButtons() {
  for (let index in localStream.getVideoTracks()) {
      vidButton.innerText = localStream.getVideoTracks()[index].enabled ? "Video Enabled" : "Video Disabled"
  }
  for (let index in localStream.getAudioTracks()) {
      muteButton.innerText = localStream.getAudioTracks()[index].enabled ? "Unmuted" : "Muted"
  }

}
function init(){
  if(!localStorage.getItem('token1')){
    navigate('/');
    notify('Not Authorised: please Signin')
  }
 


const {name,room} =queryString.parse(location.search);
if(!room ){
navigate('/join');
notify('Room is not created ');

}


if(!name){
setName(localStorage.getItem('email').split('@')[0]);
}
else{

setName(name);
}
setRoom(room);
socket.emit('join',{name:name?name:localStorage.getItem('email').split('@')[0],room,dp:localStorage.getItem('dp')},(error)=>{
  if(error){
  
    navigate('/join');
   notify("Username is taken")
  }
});

socket.on('initReceive', async (socket_id) => {
  console.log('INIT RECEIVE ' + socket_id);
  addPeer(socket_id, false);
  
  socket.emit('initSend', socket_id);
  // socket.emit("test","ok")
  console.log("added")
  // addPeer(socket_id, false);
})


socket.on('initSend', socket_id => {
console.log('INIT SEND ' + socket_id)
addPeer(socket_id, true)

})

socket.on('removePeer', socket_id => {
  console.log('removing peer ' + socket_id)
  removePeer(socket_id)
})

socket.on('disconnect', () => {
  console.log('GOT DISCONNECTED')
  for (let socket_id in peers) {
      removePeer(socket_id)
  }
})

socket.on('signal', data => {
  peers[data.socket_id].signal(data.signal)
})
}
useEffect(() => {
  let localVideo=document.getElementById("localVideo")
  socket=io(ENDPOINT);

  navigator.mediaDevices.getUserMedia(constraints).then(stream => {
      console.log('Received local stream');
      localVideo.srcObject = stream;
      localVideo.muted=true
      localStream = stream;

     init()
  
  }).catch(e =>console.log(e))
  
  
  return ()=>{
    socket.disconnect()
  }

}, []);




useEffect(() => {
 
socket.on('message',(message)=>{
  setMessages([...messages,message]);
})
socket.on('roomData',({users})=>{
  setUsers(users);
})
}, [messages]);
useEffect(() => {
 
  socket.on('code',({source,inp,out})=>{
     setSource(source);
     setInp(inp);
     setStdo(out);
  })
 }, [source,inp,stdoutt])

const handlesendcode=(code)=>{
 
    socket.emit('sendCode',{
     source:localStorage.getItem('codereal'),
     inp:inp,
     out:stdoutt
    });
}

  function onChange(newValue) {
    setSource(newValue);
    localStorage.setItem('codereal',newValue);
    handlesendcode();
  }
  function onChange1(newValue) {
    
   setInp(newValue);
  }
  const handlelang=(mode,name)=>{
      setMode(mode);
      if(mode==="javascript"){
        setLangid(63);
      }
     else if(mode==="c_cpp" && name==='c'){
        setLangid(50);
      }
      else if(mode==="c_cpp"){
        setLangid(54);
      }
     else if(mode==="java"){
        setLangid(62);
      }
     else if(mode==="csharp"){
        setLangid(51);
      }
     else if(mode==="python"){
        setLangid(71);
      }
     else if(mode==="php"){
        setLangid(68);
      }
     else if(mode==="ruby"){
        setLangid(72);
      }
     else if(mode==="typescript"){
        setLangid(74);
      }
     else if(mode==="golang"){
        setLangid(60);
      }
  }
 const download=()=>{
  const url=window.URL.createObjectURL(new Blob([source],{type:"text/plain"}));
  const link=document.createElement("a");
  link.href=url;
  link.setAttribute("download","sessioncode.txt");
  document.body.appendChild(link);
  link.click();
 }
  
    const [chat, setChat] = useState(false);
    const [whiteBoard, setWhiteBoard] = useState(false);
    const [mode, setMode] = useState("javascript");
    const [theme, setTheme] = useState("monokai");
    
    const handlesend=()=>{
     
        if(message){
          socket.emit('sendMessage',{message},()=>setMessage(''))
        }
    }

    
    const compile=async()=>{
      console.log(localStorage.getItem("tokencode"))
     setLoading(true);
   
      const options = {
        method: 'GET',
        url: `https://judge0-ce.p.rapidapi.com/submissions/${localStorage.getItem("tokencode")}`,
        params: {
          base64_encoded: 'true',
          fields: '*'
        },
        headers: {
          'X-RapidAPI-Key': '73c8c1ef10msh82919611afca92fp18bcdbjsn80fbc88f4f64',
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        }
      };
      
      try {

        const response = await axios.request(options);
        console.log(response.data);
        let statusId = response.data.status?.id;
console.log(statusId)
        // Processed - we have a result
        if (statusId === 1 || statusId === 2) {
          // still processing
          setTimeout(() => {
            compile();
          }, 2000);
          
        } else {
          if(response.data.stdout){
            console.log(statusId)
            setStdo(atob(response.data.stdout));
            console.log(response.data)
            setLoading(false);
         }
            else{
            // console.log(response.data.stdout,"hjgvyj")
            console.log(statusId)
            if(response.data.stderr)
            setStdo(atob(response.data.stderr))
           else
            setStdo(atob(response.data.compile_output))
            setLoading(false);
            }
        }
       
      } catch (error) {
        setLoading(false);
        console.error(error);
      }
     
   
      
    }
const compiler=async()=>{
  setLoading(true);
  console.log(btoa("sachin"),typeof btoa("sachin"));
  try {
 let pro=await axios.post(`https://judge0-ce.p.rapidapi.com/submissions`,{"language_id":langid,"source_code":`${btoa(source)}`,"stdin":`${btoa(inp)}`},{  
  headers: {
    'content-type': 'application/json',
    'Content-Type': 'application/json',
    'X-RapidAPI-Key': '73c8c1ef10msh82919611afca92fp18bcdbjsn80fbc88f4f64',
    'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
  },
  params: {
    base64_encoded: 'true',
    fields: '*'
  },
    }
  )
 
    const json= pro.data;
const token=json.token;
console.log(token)
localStorage.setItem("tokencode",token);
setLoading(false);
  } catch (error) {
    setStdo("Compilation Error")                                                                                                                                                          
    setLoading(false);
    console.log(error)
  }
 setLoading(false);

    compile();
    
}




  return (
    <>
       
     {loading && <Spinner/>}
    <Editornav colormic={colormic} colorvid={colorvid} muteButton={muteButton} localVideo={localVideo} vidButton={vidButton} videos={videos} switchMedia={switchMedia} toggleMute={toggleMute} toggleVid={toggleVid} source={source} contri={contri} setContri={setContri} notify={notify} download={download} whiteBoard={whiteBoard} setWhiteBoard={setWhiteBoard}  room={room} handlesendcode={handlesendcode} compiler={compiler} chat={chat} setChat={setChat}/>
     
   {chat&& <div className="absolute right-0 w-[300px] border-2 h-[80vh] z-10">
    <div className='h-[73vh] bg-yellow-200 overflow-y-scroll'>
      {
        messages.map((message,i)=>{
         return <div key={i}><Message name={name} message={message}/></div>
        })
      }
    </div>
    <div className='flex'>
      <input placeholder='Type message...' value={message} className='w-[300px] px-3' type="text" name="input" id="input" onChange={(e)=>{
        setMessage(e.target.value);
      }} />
      <button onClick={handlesend} className='btn-primary'>Send</button>
    </div>
   </div>
   


}
{whiteBoard && <div onClick={()=>{setWhiteBoard(!whiteBoard)}} className='  fixed right-14 bottom-10 cursor-pointer font-bold text-lg'>
  <BsFillDoorOpenFill/>  Room
</div>}
{whiteBoard ? <Container/>

:
<div>
<div className="absolute right-2 z-20">

</div>

  <div className="  md:grid md:grid-cols-[1fr_4fr] ">


  <div className='hidden md:block p-4 bg-slate-200 overflow-y-scroll'>
<p  className='text-center p-2 text-blue-600 text-xl font-bold'>Contributors</p>
<div>
  {users?
  <div>
   
    {users.map(({name,dp})=>{
     return <div className='grid grid-cols-[60px_1fr] mb-3 items-center' key={name}>
        <div>
         { dp?<img src={`${dp}`} alt='' width="50"/>
        :<Avatar name={name} size={50}/>}
          
        </div>
        <div>
          {name}
        </div>
     </div>
    })}
    </div>:null
  }
</div>
</div>
{ contri&& <div className='z-20 h-[100vh] absolute left-0 p-4 bg-slate-200 overflow-y-scroll'>
<p className='text-center p-2 text-blue-600 text-xl font-bold'>Contributors</p>
<div>
  {users?
  <div>
   
    {users.map(({name,dp})=>{
     return <div className='grid grid-cols-[60px_1fr] mb-3 items-center' key={name}>
        <div>
          <img src={`${dp}`} alt="dp" width="50"/>
        </div>
        <div>
          {name}
        </div>
     </div>
    })}
    </div>:null
  }
</div>
</div>}
<div>
<div >
    <div className='bg-black flex justify-between '>
        <div className='px-4 py-1 '>
        <div className="field "><label className='text-white'>Mode:</label><p className="control"><span className="select"><select onChange={(e)=>{handlelang(e.target.value,e.target.name)}}  name='mode' className="w-1/8 bg-offBlack border border-offBlack justify-start"><option value="javascript">Javascript</option><option value="java">java</option><option value='python'>python</option><option value='c_cpp' name="c">c</option><option name="cpp" value='c_cpp'>cpp</option><option value='ruby'>ruby</option><option value='php'>php</option><option value='golang'>Go</option><option value='csharp'>csharp</option><option value='typescript'>typescript</option></select></span></p></div>
        </div>
        <div>
        <div className="field px-11"><label className='text-white'>Theme:</label><p className="control"><span className="select"><select name="Theme" onChange={(e)=>{setTheme(e.target.value)}}><option value="monokai">monokai</option><option value="github">github</option><option value="tomorrow">tomorrow</option><option value="kuroir">kuroir</option><option value="twilight">twilight</option><option value="xcode">xcode</option><option value="textmate">textmate</option><option value="solarized_dark">solarized_dark</option><option value="solarized_light">solarized_light</option><option value="terminal">terminal</option></select></span></p></div>
        </div>
        <div>
        {/* <div onClick={()=>{setcomplete(!complete)}} className="field"><p className="control"><label className="checkbox"><input  type="checkbox"/>Enable Live Autocomplete</label></p></div> */}
        </div>
    </div>
<AceEditor

  mode={mode}
  theme={theme}
  name="example"
  width='auto'
  value={source}
  onChange={onChange}
  fontSize={14}
  showPrintMargin={true}
  showGutter={true}
  highlightActiveLine={true}
  editorProps={{ $blockScrolling: true }}
  setOptions={{
  enableBasicAutocompletion: true,
  enableLiveAutocompletion: false,
  enableSnippets: false,
  showLineNumbers: true,
  tabSize: 2,
  }}/>
</div>
<div className='sm:grid sm:grid-cols-2 '>
<div className=' border-2'>
<p className='text-center'>input</p>

<AceEditor
placeholder='input'
    mode={mode}
    theme={theme}
    value={inp}
    onChange={onChange1}
    width="auto"
    height='150px'
    fontSize={18}
    name="input"
    editorProps={{ $blockScrolling: true }}
  />
</div>
<div className=' border-2'>
    <p className='text-center'>output</p>
<AceEditor
placeholder='output'
    mode={mode}
    theme={theme}
    value={stdoutt}
    width="auto"
    height='150px'
    fontSize={18}
    name="output"
    editorProps={{ $blockScrolling: true }}
  />
</div>
</div>
</div>
  </div>

  </div>}
    </>
  )
}

export default Room