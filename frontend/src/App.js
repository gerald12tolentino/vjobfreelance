import Button from "@material-ui/core/Button"
import IconButton from "@material-ui/core/IconButton"
import TextField from "@material-ui/core/TextField"
import AssignmentIcon from "@material-ui/icons/Assignment"
import PhoneIcon from "@material-ui/icons/Phone"
import { Videocam, Mic, VideocamOff, MicOff} from '@material-ui/icons';
import React, { useEffect, useRef, useState } from "react"
import { CopyToClipboard } from "react-copy-to-clipboard"
import Peer from "simple-peer"
import io from "socket.io-client"
import "./App.css"

const socket = io.connect('http://localhost:5000')
function App() {
	const [ me, setMe ] = useState("")
	const [ stream, setStream ] = useState()
	const [ receivingCall, setReceivingCall ] = useState(false)
	const [ caller, setCaller ] = useState("")
	const [ callerSignal, setCallerSignal ] = useState()
	const [ callAccepted, setCallAccepted ] = useState(false)
	const [ idToCall, setIdToCall ] = useState("")
	const [ callEnded, setCallEnded] = useState(false)
	const [ name, setName ] = useState("")
	const [isVideo, setVid] = useState(false);
	const [isAudio, setAudio] = useState(false);
	const myVideo = useRef()
	const userVideo = useRef()
	const connectionRef= useRef()

	useEffect(() => {
		navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
			setStream(stream)
				myVideo.current.srcObject = stream
		})

	socket.on("me", (id) => {
			setMe(id)
		})

		socket.on("callUser", (data) => {
			setReceivingCall(true)
			setCaller(data.from)
			setName(data.name)
			setCallerSignal(data.signal)
		})
	}, [])

	const callUser = (id) => {
		const peer = new Peer({
			initiator: true,
			trickle: false,
			stream: stream
		})
		peer.on("signal", (data) => {
			socket.emit("callUser", {
				userToCall: id,
				signalData: data,
				from: me,
				name: name
			})
		})
		peer.on("stream", (stream) => {
			
				userVideo.current.srcObject = stream
			
		})
		socket.on("callAccepted", (signal) => {
			setCallAccepted(true)
			peer.signal(signal)
		})

		connectionRef.current = peer
	}

	const answerCall =() =>  {
		setCallAccepted(true)
		const peer = new Peer({
			initiator: false,
			trickle: false,
			stream: stream
		})
		peer.on("signal", (data) => {
			socket.emit("answerCall", { signal: data, to: caller })
		})
		peer.on("stream", (stream) => {
			userVideo.current.srcObject = stream
		})

		peer.signal(callerSignal)
		connectionRef.current = peer
	}

	const leaveCall = () => {
		setCallEnded(true)
		connectionRef.current.destroy()
	}

	const HideVid = () => {
		setVid(!isVideo);
		stream.getVideoTracks()[0].enabled = isVideo;
	  };
	  const MuteAud = () => {
		setAudio(!isAudio);
		stream.getAudioTracks()[0].enabled = isAudio;
	  };

	return (
		<>
		<h1 style={{ textAlign: "left", color: '#01055c', marginLeft: '7%' }}>Vjob</h1>
		<h3 style={{ textAlign: "left", color: '#01055c', marginLeft: '7%' }}>Freelancing Website with Video Conferencing Support</h3>
		<div className="container">
			<div className="video-container">
				<div className="video">
					{stream &&  <video playsInline muted ref={myVideo} autoPlay style={{ width: "100%" }} />}
				</div>
				<div className="video">
					{callAccepted && !callEnded ?
					<video playsInline ref={userVideo} autoPlay style={{ width: "100%"}} />:
					null}
				</div>
			</div>
			<div className="myId">
				<div className="MediaControl">
				<div className="fnction">
				<TextField
					id="filled-basic"
					label="Name"
					variant="filled"
					value={name}
					onChange={(e) => setName(e.target.value)}
					style={{ marginBottom: "20px" }}
				/>
				</div>
				<div className="fnction">
				<CopyToClipboard text={me} style={{ marginBottom: "2rem" }}>
					<Button variant="contained" color="primary" startIcon={<AssignmentIcon fontSize="large" />}>
						Copy ID
					</Button>
				</CopyToClipboard>
				</div>
				<div className="fnction">
				<TextField
					id="filled-basic"
					label="ID to call"
					variant="filled"
					value={idToCall}
					onChange={(e) => setIdToCall(e.target.value)}
				/>
				</div>
				<div className="fnctionleft">
				{isVideo ? (
					<VideocamOff variant="contained" color="primary" fontSize="large" fullWidth onClick={() => HideVid()} />
				) : (
					<Videocam variant="contained" color="primary" fontSize="large" fullWidth onClick={() => HideVid()} />
				)}
				</div>
				<div className="fnctionleft">
				{isAudio ? (
					<MicOff variant="contained" color="primary" fontSize="large" fullWidth onClick={() => MuteAud()} />
				) : (
					<Mic variant="contained" color="primary"  fontSize="large" fullWidth onClick={() => MuteAud()} />
				)}
				</div>
				<div className="fnction">
					{callAccepted && !callEnded ? (
						<Button variant="contained" color="secondary" onClick={leaveCall}>
							Leave Room
						</Button>
					) : (
						<IconButton color="primary" onClick={() => callUser(idToCall)}>
							<PhoneIcon fontSize="large" />
						</IconButton>
					)}
				</div>
			</div>
			</div>
			<div>
				{receivingCall && !callAccepted ? (
						<div className="caller">
						<h1 >{name} is asking to Join the Room</h1>
						<Button variant="contained" color="primary" onClick={answerCall}>
							Accept
						</Button>
					</div>
				) : null}
			</div>
		</div>
		</>
	)
}

export default App
