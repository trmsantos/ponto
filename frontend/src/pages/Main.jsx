import React, { useEffect, useState, useRef } from 'react';
//import { Button } from "antd-mobile/cjs";
import { Alert, Button } from "antd";
import { Container, Row, Col } from 'react-grid-system';
import styled from 'styled-components';
import { EnterOutlined, RedoOutlined, CloseCircleOutlined, CheckCircleOutlined, CameraTwoTone, CameraFilled, PlayCircleFilled, StopFilled } from '@ant-design/icons';
import Webcam from "react-webcam";
import { useSubmitting } from "utils";
import { API_URL } from "config";
import { fetchPost } from "utils/fetch";
import Logo from 'assets/logo.svg';
import dayjs from 'dayjs';
import { DATETIME_FORMAT, STAND_STILL_DURATION, AUTO_SAMPLE_INTERVAL, AUTO_MOTION_TOLERANCE, ON_CONFIRM_TIMEOUT, ON_END_MESSAGE_TIMEOUT,ON_BEFORECONFIRM_TIMEOUT } from 'config';
import { useImmer } from "use-immer";
import pixelMatch from 'pixelmatch';
import { CameraOptions, useFaceDetection } from 'react-use-face-detection';
import FaceDetection from '@mediapipe/face_detection';
import { Camera } from '@mediapipe/camera_utils';

const videoConstraints = {
	width: 1280,
	height: 720,
	facingMode: "user"
};
const StyledButton = styled(Button)`
	font-weight:700;
	width:150px!important;
	height:70px!important;
	font-size:28px !important;
`;
const StyledAlert = styled.div`
	.ant-alert{
		display:flex;
		align-items:center;		
	}
	.ant-alert-message{
		font-size:16px;
		margin-bottom:0px;
		font-weight:600;
	}

`;
const Spin = styled.div`
.spinner {
	margin: 5px auto 0;
	width: 70px;
	text-align: center;
  }
  
  .spinner > div {
	width: 18px;
	height: 18px;
	background-color: #333;
  
	border-radius: 100%;
	display: inline-block;
	-webkit-animation: sk-bouncedelay 1.4s infinite ease-in-out both;
	animation: sk-bouncedelay 1.4s infinite ease-in-out both;
  }
  
  .spinner .bounce1 {
	-webkit-animation-delay: -0.32s;
	animation-delay: -0.32s;
  }
  
  .spinner .bounce2 {
	-webkit-animation-delay: -0.16s;
	animation-delay: -0.16s;
  }
  
  @-webkit-keyframes sk-bouncedelay {
	0%, 80%, 100% { -webkit-transform: scale(0) }
	40% { -webkit-transform: scale(1.0) }
  }
  
  @keyframes sk-bouncedelay {
	0%, 80%, 100% { 
	  -webkit-transform: scale(0);
	  transform: scale(0);
	} 40% { 
	  -webkit-transform: scale(1.0);
	  transform: scale(1.0);
	}
  }
`;
const Spinner = () => {
	return (<Spin> <div className="spinner">
		<div className="bounce1"></div>
		<div className="bounce2"></div>
		<div className="bounce3"></div>
	</div></Spin>);
}

const BlockWait = ({ submitting }) => {
	return (<>
		{(submitting.state) &&
			<Row gutterWidth={2} style={{ height: "60px", marginTop: "30px", marginBottom: "30px" }}>
				<Col></Col>
				<Col xs="content" style={{ fontWeight: 200, fontSize: "25px" }}>Aguarde um momento <Spinner /></Col>
				<Col></Col>
			</Row>
		}
	</>);
}

const fetchclientes = async (signal) => {}
const Toolbar = ({ data, auto, onAuto }) => {
	return (<>
		{!data.type &&
			<Row gutterWidth={2} style={{ margin: "10px 0px 10px 0px", alignItems: "center" }}>
				<Col>
					<Row nogutter style={{ background: "#f0f0f0", borderRadius: "5px", padding: "5px", display: "flex", alignItems: "center", marginBottom: "30px" }}>
						<Col style={{ textAlign: "left" }}><Logo style={{ width: "100px", height: "16px" }} /></Col>
						<Col style={{ textAlign: "center", fontSize: "24px", fontWeight: 700 }}>{!data.date && data.dateInterval.toLocaleTimeString('pt-PT', {
							hour: '2-digit',
							minute: '2-digit',
							second: '2-digit'
						})}
							{data.date && data.date.toLocaleTimeString('pt-PT', {
								hour: '2-digit',
								minute: '2-digit',
								second: '2-digit'
							})}</Col>
						<Col style={{ textAlign: "right", fontWeight: 400, fontSize: "14px" }}>
							<Row gutterWidth={10}>
								<Col style={{ textAlign: "right", alignSelf: "center" }}>{!data.date && data.dateInterval.toLocaleDateString('pt-PT', {
									day: '2-digit',
									month: 'long',
									year: 'numeric'
								})}
									{data.date && data.date.toLocaleDateString('pt-PT', {
										day: '2-digit',
										month: 'long',
										year: 'numeric'
									})}</Col>
							</Row>
							<Row gutterWidth={10} style={{ display: "flex", justifyContent: "end" }}>
								<Col xs="content"><Button style={{ padding: "0px 10px" }} fill='none' onTouchStart={onAuto}>{auto ? <StopFilled /> : <PlayCircleFilled style={{ fontSize: "16px" }} />}</Button></Col>
							</Row>
						</Col>
					</Row>
				</Col>
			</Row>
		}
	</>);
}

const BlockError = ({ submitting, error, reset }) => {
	return (<>
		{error?.status === true && <Row gutterWidth={2} style={{ alignItems: "center", fontWeight: 400 }}>
			<Col></Col>
			<Col xs="content">
				<StyledAlert>
					<Alert
						style={{ margin: "10px 0px", padding: "20px" }}
						message={<div style={{ fontSize: "18px", fontWeight: 400 }}><span style={{ fontWeight: 700 }}>Erro!</span></div>}
						showIcon
						description={<div style={{ fontSize: "16px" }}>{error?.text}</div>}
						type="error"
						action={<Button disabled={submitting.state} onTouchStart={() => !submitting.state && reset()} size="small" fill='none' color='danger'>Tentar novamente</Button>}
					/>
				</StyledAlert>
			</Col>
			<Col></Col>
		</Row>}
	</>);
}

const BlockNumPad = ({ auto, data, submitting, reset, capture, onNumPadClick }) => {
	return (<>
		{(!auto && !submitting.state && !data.error.status) && <>

			<Row gutterWidth={2} style={{ marginTop: "30px", marginBottom: "30px" }}>
				<Col></Col>
				{(!data.snapshot) && <Col xs="content" style={{ fontSize: "30px", fontWeight: 700 }}>MARQUE O NÚMERO DE COLABORADOR</Col>}
				<Col></Col>
			</Row>
			{(!data.nome) && <Row gutterWidth={2} style={{ marginBottom: "10px" }}>
				<Col></Col>
				<Col xs="content" style={{ minWidth: "454px", fontSize: "40px", border: "solid 2px #d9d9d9", borderRadius: "3px", textAlign: "center" }}><span style={{ color: "#8c8c8c" }}>F00</span>{data.num}</Col>
				<Col></Col>
			</Row>
			}
			{(!data.snapshot) && <><Row gutterWidth={2}>
				<Col></Col>
				<Col xs="content"><StyledButton disabled={submitting.state} onTouchStart={() => !submitting.state && onNumPadClick(1)} size="large">1</StyledButton></Col>
				<Col xs="content"><StyledButton disabled={submitting.state} onTouchStart={() => !submitting.state && onNumPadClick(2)} size="large">2</StyledButton></Col>
				<Col xs="content"><StyledButton disabled={submitting.state} onTouchStart={() => !submitting.state && onNumPadClick(3)} size="large">3</StyledButton></Col>
				<Col></Col>
			</Row>
				<Row gutterWidth={2}>
					<Col></Col>
					<Col xs="content"><StyledButton disabled={submitting.state} onTouchStart={() => !submitting.state && onNumPadClick(4)} size="large">4</StyledButton></Col>
					<Col xs="content"><StyledButton disabled={submitting.state} onTouchStart={() => !submitting.state && onNumPadClick(5)} size="large">5</StyledButton></Col>
					<Col xs="content"><StyledButton disabled={submitting.state} onTouchStart={() => !submitting.state && onNumPadClick(6)} size="large">6</StyledButton></Col>
					<Col></Col>
				</Row>
				<Row gutterWidth={2}>
					<Col></Col>
					<Col xs="content"><StyledButton disabled={submitting.state} onTouchStart={() => !submitting.state && onNumPadClick(7)} size="large">7</StyledButton></Col>
					<Col xs="content"><StyledButton disabled={submitting.state} onTouchStart={() => !submitting.state && onNumPadClick(8)} size="large">8</StyledButton></Col>
					<Col xs="content"><StyledButton disabled={submitting.state} onTouchStart={() => !submitting.state && onNumPadClick(9)} size="large">9</StyledButton></Col>
					<Col></Col>
				</Row>
				<Row gutterWidth={2}>
					<Col></Col>
					<Col xs="content"><StyledButton style={{ color: "#ed143d" }} disabled={data.snapshot || submitting.state} onTouchStart={() => !(data.snapshot || submitting.state) && onNumPadClick('C')} size="large">C</StyledButton></Col>
					<Col xs="content"><StyledButton disabled={submitting.state} onTouchStart={() => !submitting.state && onNumPadClick(0)} size="large">0</StyledButton></Col>
					<Col xs="content">
						{!data.snapshot && <StyledButton disabled={!parseInt(data.num) || submitting.state} onTouchStart={() => !(!parseInt(data.num) || submitting.state) && capture()} size="large"><CameraTwoTone style={{ fontSize: "48px" }} /></StyledButton>}
						{data.snapshot && <StyledButton disabled={submitting.state} onTouchStart={() => !submitting.state && reset()} icon={<RedoOutlined />} size="large" />}
					</Col>
					<Col></Col>
				</Row>
			</>}
		</>
		}
	</>);
}

const BlockConfirm = ({ submitting, data, onConfirm }) => {

	return (<>
		{(!submitting.state && !data.error.status) && <>

			<Row gutterWidth={2} style={{ marginTop: "30px", marginBottom: "30px" }}>
				<Col></Col>
				{(data.level == 1 && data.nome) && <Col xs="content" style={{ fontWeight: 200, fontSize: "25px", display: "flex", flexDirection: "column", alignItems: "center" }}>Confirma que é <div><span style={{ fontWeight: 600 }}>{data.nome}</span>?</div></Col>}
				<Col></Col>
			</Row>

			{(data.level == 1 && data.nome) && <>

				<Row style={{ margin: "20px 0px" }} gutterWidth={25}>
					<Col></Col>
					<Col xs="content"><Button disabled={submitting.state} onTouchStart={() => !submitting.state && onConfirm(true)} shape='rounded' style={{ border: "none", minWidth: "130px", minHeight: "130px", color: "#52c41a" }}><CheckCircleOutlined style={{ fontSize: "80px" }} /></Button></Col>
					<Col xs="content"><Button disabled={submitting.state} onTouchStart={() => !submitting.state && onConfirm(false)} shape='rounded' style={{ border: "none", minWidth: "130px", minHeight: "130px", color: "#f5222d" }}><CloseCircleOutlined style={{ fontSize: "80px" }} /></Button></Col>
					<Col></Col>
				</Row>
			</>}
		</>
		}
	</>);
}

const BlockIO = ({ submitting, data, onFinish }) => {

	return (<>
		{(!submitting.state && !data.error.status) && <>

			<Row gutterWidth={2} style={{ marginTop: "30px", marginBottom: "30px" }}>
				<Col></Col>
				{(data.level == 2 && data.nome) && <Col xs="content" style={{ fontWeight: 200, fontSize: "25px", display: "flex", flexDirection: "column", alignItems: "center" }}>
					Olá
					<div><span style={{ fontWeight: 600 }}>{data.nome}</span></div>
				</Col>}
				<Col></Col>
			</Row>
			{(data.level == 2 && data.nome) && <>
				<Row style={{ margin: "20px 0px" }} gutterWidth={25}>
					<Col></Col>
					<Col xs="content"><Button disabled={submitting.state} onTouchStart={() => !submitting.state && onFinish('in')}  shape="circle" style={{ minWidth: "130px", minHeight: "130px", background: "#52c41a", color: "#fff", fontSize: "20px" }}>Entrada</Button></Col>
					<Col xs="content"><Button disabled={submitting.state} onTouchStart={() => !submitting.state && onFinish("out")}  shape="circle" style={{ minWidth: "130px", minHeight: "130px", background: "#f5222d", color: "#fff", fontSize: "20px" }}>Saída</Button></Col>
					<Col></Col>
				</Row>
			</>}
		</>
		}
	</>);
}

const BlockMessage = ({ data, reset }) => {
	return (<>
		{data.type &&
			<Row nogutter style={{ height: "70vh", display: "flex", alignItems: "center" }}>
				<Col>
					<Row>
						<Col></Col>
						<Col xs="content" style={{ fontWeight: 200, fontSize: "30px" }}><div dangerouslySetInnerHTML={{ __html: data.type == "in" ? data.config?.MESSAGE_IN : data.config?.MESSAGE_OUT }}></div></Col>
						<Col></Col>
					</Row>
					<Row>
						<Col></Col>
						<Col xs="content"><Button fill="none" color='primary' size="large" onTouchStart={reset} style={{}}>Novo Registo</Button></Col>
						<Col></Col>
					</Row>
				</Col>
			</Row>
		}
	</>);
}

const BlockFoto = ({ data }) => {
	return (<>
		{((data.level == 1 || data.level == 2) && data.recon && data.foto !== null) && <img style={{ borderRadius: "5px" }} height={320} src={data.foto} />}
		{(((data.level == 1 || data.level == 2) && data.foto === null && data.recon) || (data.level == 2 && !data.recon)) && <img src="data:image/png;base64,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" />}
	</>);
}

const BlockSnapshot = ({ data }) => {
	return (<>
		{((data.level == 0 || data.level == 1) && data.snapshot && !data.recon) && <img style={{ borderRadius: "5px" }} height={320} src={data.snapshot} />}
	</>);
}

const BlockIdentity = ({ data }) => {
	return (<>
		{(data.level == 1 && !data.recon && data.valid_names.length > 0) &&
			<Alert
				style={{ margin: "10px 0px", padding: "20px" }}
				message={<div style={{ fontSize: "16px", fontWeight: 400 }}><span style={{ fontWeight: 700 }}>Aviso!</span> O sistema identificou-o(a) como:</div>}
				description={<>
					{data.valid_names.map(v => {
						return (<div key={`U-${v.REFNUM_0}`}>
							<div style={{ marginTop: "10px", fontSize: "18px", fontWeight: 600 }}><span style={{ fontWeight: 400 }}>{v.REFNUM_0}</span> <span>{`${v.SRN_0} ${v.NAM_0.toLowerCase().replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())}`}</span></div>
						</div>);
					})}
				</>}
				type="warning"
				showIcon
			/>}
		{(data.level == 1 && !data.recon && data.valid_names.length === 0) &&
			<Alert
				style={{ margin: "10px 0px", padding: "20px" }}
				message={<div style={{ fontSize: "18px", fontWeight: 400 }}><span style={{ fontWeight: 700 }}>Aviso!</span></div>}
				description={<div style={{ marginTop: "10px", fontSize: "16px", fontWeight: 400 }}>O sistema não o(a) identificou!</div>}
				type="warning"
				showIcon
			/>}
	</>);
}

const BlockWebcam = React.forwardRef(({ auto, data, boundingBox }, ref) => {
	return (<>
		<div style={{ display: data.snapshot && "none" }}>
			{/* {auto && boundingBox.map((box, index) => (
				<div
					key={`${index + 1}`}
					style={{
						border: '4px solid #52c41a',
						borderRadius: "5px",
						position: 'absolute',
						top: `${box.yCenter * 100}%`,
						left: `${box.xCenter * 100}%`,
						width: `${box.width * 100}%`,
						height: `${box.height * 100}%`,
						zIndex: 1,
					}}
				/>
			))} */}
			<Webcam
				minScreenshotWidth={1280}
				minScreenshotHeight={720}
				audio={false}
				ref={ref}
				height={320}
				screenshotFormat="image/jpeg"
				videoConstraints={videoConstraints}
				style={{ borderRadius: "5px", /* boxShadow: "rgba(0, 0, 0, 0.16) 0px 1px 4px" */ }}
			/>
		</div>
	</>);
});

const BlockMessageStandStill = ({ submitting, data, auto, capturing, standStillCounter }) => {
	return (
		<>
			{(auto && data.level == 0 && capturing && !submitting.state && !data.error.status) &&
				<Row gutterWidth={2} style={{ marginTop: "30px", marginBottom: "30px" }}>
					<Col></Col>
					<Col xs="content" style={{ fontWeight: 200, fontSize: "25px", display: "flex", flexDirection: "column", alignItems: "center" }}>Por favor, <span style={{ fontWeight: 700 }}>permaneça imóvel</span> em frente à câmera por {standStillCounter - 1} segundos...</Col>
					<Col></Col>
				</Row>
			}
		</>
	);
}

const BlockCaptureAuto = ({ auto, onCaptureAuto, capturing, data, submitting }) => {
	return (<>
		{(auto && data.level == 0 && !capturing && !submitting.state && !data.error.status) &&

			<Row style={{ marginTop: "20px" }}>
				<Col><Button style={{height:"250px"}} block onTouchStart={onCaptureAuto} size="large"><CameraTwoTone style={{ fontSize: "52px" }} /></Button></Col>
			</Row>

		}
	</>);
}

const clearTimer = (timer, timeout = true) => {
	if (timer.current) {
		if (timeout) {
			clearTimeout(timer.current);
		} else {
			clearInterval(timer.current);
		}

	}
	timer.current = null;
}

export default ({ }) => {
	const autoTriggered = React.useRef(false);
	const [detected, setDetected] = useState(false);
	const boundingBox = [];
/* 	const { webcamRef, boundingBox, isLoading, detected, facesDetected } = useFaceDetection({
		faceDetectionOptions: {
			model: 'short',
		},
		faceDetection: new FaceDetection.FaceDetection({
			locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
		}),
		camera: ({ mediaSrc, onFrame, width, height }) =>
			new Camera(mediaSrc, {
				onFrame,
				width,
				height,
			}),
	}); */



	const submitting = useSubmitting(false);
	const webcamRef = React.useRef(null);
	const timeout = React.useRef(null);
	const beforeConfirmTimeout = React.useRef(null);
	const [capturing, setCapturing] = useState(false);

	// const [motionDetected, setMotionDetected] = useState(0);
	const [standStillCounter, setStandStillCounter] = useState(STAND_STILL_DURATION + 1);
	const standStillTimer = React.useRef(null);
	const autoTimer = React.useRef(null);
	// const autoSampleTimer = React.useRef(null);

	// const canvasRef = useRef(null);
	const [auto, setAuto] = useState(false);
	const [data, updateData] = useImmer({
		existsInBd: false,
		level: 0,
		num: '',
		nome: '',
		error: { status: false, text: '' },
		snapshot: null,
		dateInterval: new Date(),
		date: null,
		hsh: null,
		type: null,
		recon: null,
		foto: null,
		valid_filepaths: [],
		valid_nums: [],
		valid_names: [],
		config: {}
	});
	const loadInterval = async () => {
		const request = (async () => updateData(draft => { draft.dateInterval = new Date(); }));
		request();
		return setInterval(request, 1000);
	}
	// const initMotionDetection = () => {
	// 	const canvas = canvasRef.current;
	// 	const ctx = canvas.getContext('2d', { willReadFrequently: true });
	// 	let lastImageData;

	// 	// Request access to the user's webcam
	// 	navigator.mediaDevices.getUserMedia({ video: true })
	// 		.then(stream => {
	// 			const video = document.createElement('video');
	// 			video.srcObject = stream;
	// 			video.autoplay = true;

	// 			// Check for motion every 100 milliseconds
	// 			autoSampleTimer.current = setInterval(() => {
	// 				// Capture the current frame from the video
	// 				canvas.width = video.videoWidth;
	// 				canvas.height = video.videoHeight;
	// 				ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
	// 				const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	// 				if (lastImageData) {
	// 					// Calculate the difference between the current frame and the previous frame
	// 					const diff = pixelMatch(imageData.data, lastImageData.data, null, canvas.width, canvas.height, { threshold: 0.2 });

	// 					// If there is motion, start the timer
	// 					//setLog(`----diff>${diff}`);
	// 					if (diff > AUTO_MOTION_TOLERANCE) {

	// 						setMotionDetected(Date.now());
	// 					}
	// 				}

	// 				// Save the current frame's data for comparison in the next loop
	// 				lastImageData = imageData;
	// 			}, AUTO_SAMPLE_INTERVAL);
	// 		})
	// 		.catch(error => {
	// 			console.error('Error accessing webcam:', error);
	// 		});
	// }
	useEffect(() => {
		//const controller = new AbortController();
		const interval = loadInterval();
		//initMotionDetection();
		return (() => { clearInterval(interval); /* clearTimer(autoSampleTimer, false); */ clearTimer(autoTimer); });
	}, []);


	useEffect(() => {
		if (auto && detected && !autoTriggered.current) {
			autoTriggered.current=true;
			onCaptureAuto();
			//setTimeout(()=>{ detected && onCaptureAuto();},5000);
		}
	}, [detected]);

	// useEffect(() => {
	// 	// Start the timer when motion is detected
	// 	if (motionDetected > 0) {
	// 		if (!capturing) {
	// 			standStillTimer.current = setInterval(() => { setStandStillCounter(prev => prev - 1); }, 1000);
	// 			setCapturing(true);
	// 		}
	// 		updateAutoTimer(STAND_STILL_DURATION, () => autoCapture());
	// 	}
	// }, [motionDetected, autoTimer.current]);	
	// const startAutoTimer = (duration, fn) => {
	// 	autoTimer.current = setTimeout(fn, duration * 1000);
	// }
	// const updateAutoTimer = (duration, fn) => {
	// 	if (!autoTimer.current){
	// 		clearTimer(autoTimer);
	// 		setStandStillCounter(STAND_STILL_DURATION + 1);
	// 		autoTimer.current = setTimeout(fn, duration * 1000);
	// 	}
	// }
	const onCaptureAuto = () => {
		if (auto) {
			if (!capturing) {
				standStillTimer.current = setInterval(() => { setStandStillCounter(prev => prev - 1); }, 1000);
				setCapturing(true);
				autoTimer.current = setTimeout(() => autoCapture(), STAND_STILL_DURATION * 1000);
			}
		}
	}
	const reset = () => {
		clearTimer(timeout);
		clearTimer(beforeConfirmTimeout);
		setStandStillCounter(STAND_STILL_DURATION + 1);
		setCapturing(false);
		clearTimer(standStillTimer, false);
		// clearTimer(autoSampleTimer, false);
		/* 		if (auto) {
					initMotionDetection();
				} */
		//TODO - FALTA OS RESTANTES TIMERS...
		updateData(draft => {
			draft.existsInBd = false;
			draft.config = {};
			draft.level = 0;
			draft.num = '';
			draft.nome = '';
			draft.snapshot = null;
			draft.hsh = null;
			draft.date = null;
			draft.type = null;
			draft.error = { status: false, text: "" };
			draft.recon = null;
			draft.foto = null;
			draft.valid_filepaths = [];
			draft.valid_nums = [];
			draft.valid_names = [];
		});
		autoTriggered.current=false;
		submitting.end();
	}
	const onNumPadClick = (v) => {
		if (v === "C") {
			updateData(draft => { draft.num = '' });
		} else if (v === "ENTER") {

		} else {
			if (data.num.length < 3) {
				updateData(draft => { draft.num = `${data.num}${v}` });
			}
		}
	}
	const autoCapture = async () => {
		if (!auto) { return; }
		// clearTimer(autoSampleTimer, false);
		setStandStillCounter(STAND_STILL_DURATION + 1);
		clearTimer(standStillTimer, false);
		setCapturing(false);
		const imageSrc = webcamRef.current.getScreenshot();
		submitting.trigger();
		try {
			//const vals = { num: `F${data.num.padStart(5, '0')}` };
			const vals = {};
			const _ds = data.dateInterval
			updateData(draft => {
				//draft.num = data.num.padStart(3, '0');
				draft.snapshot = imageSrc;
				draft.date = _ds;
			});
			let response = await fetchPost({ url: `${API_URL}/rponto/sql/`, filter: { ...vals }, parameters: { method: "AutoCapture", snapshot: imageSrc, timestamp: dayjs(_ds).format(DATETIME_FORMAT) } });
			if (response.data.status !== "error" && response.data?.rows?.length > 0) {
				updateData(draft => {
					draft.num = response.data?.rows[0].NFUNC;
					draft.config = response.data.config;
					draft.level = 1;
					draft.recon = response.data.result;
					draft.foto = response.data.foto;
					draft.valid_nums = response.data?.valid_nums;
					draft.valid_filepaths = response.data?.valid_filepaths;
					draft.valid_names = response.data?.valid_names;
					draft.nome = `${response.data.rows[0].NFUNC} ${response.data.rows[0].NOME}`;
				});
			} else {
				updateData(draft => { draft.error = { status: true, text: response.data?.title } });
			}
			submitting.end();
		} catch (e) {
			updateData(draft => { draft.error = { status: true, text: e.message } });
			submitting.end();
		};
		beforeConfirmTimeout.current = setTimeout(reset, ON_BEFORECONFIRM_TIMEOUT);
	}


	const capture = React.useCallback(
		async () => {
			const imageSrc = webcamRef.current.getScreenshot();
			submitting.trigger();
			try {
				const vals = { num: `F${data.num.padStart(5, '0')}` };
				const _ds = data.dateInterval
				updateData(draft => {
					draft.num = data.num.padStart(3, '0');
					draft.snapshot = imageSrc;
					draft.date = _ds;
				});
				let response = await fetchPost({ url: `${API_URL}/rponto/sql/`, filter: { ...vals }, parameters: { method: "SetUser", snapshot: imageSrc, timestamp: dayjs(_ds).format(DATETIME_FORMAT) } });
				if (response.data.status !== "error" && response.data?.rows?.length > 0) {
					updateData(draft => {
						draft.existsInBd = response.data.existsInBd;
						draft.config = response.data.config;
						draft.level = 1;
						draft.recon = response.data.result;
						draft.foto = response.data.foto;
						draft.valid_nums = response.data?.valid_nums;
						draft.valid_filepaths = response.data?.valid_filepaths;
						draft.valid_names = response.data?.valid_names;
						const row = response.data.rows[0];
						let nome = '';

						// SAGE
						if (row.SRN_0 && row.NAM_0) {
						nome = `${row.SRN_0} ${row.NAM_0.toLowerCase().replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())}`;
						} else if (row.NOME) {
						nome = row.NOME;
						} else {
						nome = row.NFUNC || ''; 
						}
						draft.nome = nome;
					});
				} else {
					updateData(draft => { draft.error = { status: true, text: response.data?.title } });
				}
				submitting.end();
			} catch (e) {
				updateData(draft => { draft.error = { status: true, text: e.message } });
				submitting.end();
			};

		},
		[webcamRef, data.num]
	);
	const onConfirm = async (v) => {
		clearTimer(beforeConfirmTimeout);
		if (v === true) {
			submitting.trigger();
			try {
				const vals = { num: data.num.startsWith("F") ? data.num : `F${data.num.padStart(5, '0')}` };
				const learn = (data?.existsInBd === true && Array.isArray(data?.valid_nums) && data.valid_nums.length === 0 && !data?.recon) ? true : false;
				let response = await fetchPost({ url: `${API_URL}/rponto/sql/`, filter: { ...vals }, parameters: { method: "SetUser",auto, save: true, learn, snapshot: data.snapshot, timestamp: dayjs(data.date).format(DATETIME_FORMAT) } });
				if (response.data.status !== "error" && response.data.hsh) {
					updateData(draft => {
						draft.level = 2;
						draft.hsh = response.data.hsh;
						// draft.recon = response.data.result;
						// draft.foto = response.data.foto;
						// draft.valid_nums = response.data?.valid_nums;
						// draft.valid_filepaths = response.data?.valid_filepaths;
						// draft.valid_names = response.data?.valid_names;
					});
					if (!response.data?.valid_nums || response.data?.valid_nums?.length === 0) {
						timeout.current = setTimeout(reset, ON_CONFIRM_TIMEOUT);
					}
				} else {
					updateData(draft => { draft.error = { status: true, text: response.data?.title } });
					timeout.current = setTimeout(reset, ON_CONFIRM_TIMEOUT);
				}
				submitting.end();
			} catch (e) {
				updateData(draft => { draft.error = { status: true, text: e.message } });
				timeout.current = setTimeout(reset, ON_CONFIRM_TIMEOUT);
				submitting.end(); 	
			};
		}
		else {
			reset();
		}
	}
	const onFinish = async (t) => {
		clearTimer(timeout);
		submitting.trigger();
		try {
			const vals = { num: data.num.startsWith("F") ? data.num : `F${data.num.padStart(5, '0')}` };
			let response = await fetchPost({ url: `${API_URL}/rponto/sql/`, filter: { ...vals }, parameters: { method: "SetUser", hsh: data.hsh, save: true, type: t } });
			if (response.data.status !== "error") {
				updateData(draft => { draft.type = t, draft.level = 3; });
				timeout.current = setTimeout(reset, ON_END_MESSAGE_TIMEOUT);
			} else {
				updateData(draft => { draft.error = { status: true, text: "Ocorreu um erro no registo! Por favor entre em contacto com os Recursos Humanos." } });
				submitting.end();
			}
		} catch (e) {
			updateData(draft => { draft.error = { status: true, text: e.message } });
			submitting.end();
		};
	}
	const onAuto = () => {
		if (auto === false) {
			// initMotionDetection();
		} else {
			// clearTimer(autoSampleTimer, false);
			clearTimer(beforeConfirmTimeout);
			clearTimer(autoTimer);
			clearTimer(standStillTimer, false);
			setCapturing(false);
		}
		setAuto(prev => !prev);
	}

	return (<>
		{/* <canvas ref={canvasRef} style={{ display: 'none' }} /> */}
		<Container fluid style={{ fontWeight: 700 }}>
			<BlockMessage data={data} reset={reset} />
			<Toolbar data={data} auto={auto} onAuto={onAuto} />

			{!data.type && <>
				<Row gutterWidth={2} style={{ margin: "0px 0px 10px 0px", alignItems: "center" }}>
					<Col></Col>
					<Col style={{ display: "flex", justifyContent: "center" }}>
						<Row gutterWidth={15}>
							<Col xs="content" style={{ height: "100%", alignSelf: "center" }}></Col>
							<Col xs="content" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
								<BlockWebcam auto={auto} data={data} ref={webcamRef} boundingBox={boundingBox} />
								<BlockSnapshot data={data} />
								<BlockFoto data={data} />
								<BlockIdentity data={data} />
							</Col>
						</Row>
					</Col>
					<Col></Col>
				</Row>

				<BlockWait submitting={submitting} />
				<BlockError submitting={submitting} reset={reset} error={data?.error} />
				<BlockMessageStandStill data={data} auto={auto} submitting={submitting} capturing={capturing} standStillCounter={standStillCounter} />
				<BlockCaptureAuto auto={auto} onCaptureAuto={onCaptureAuto} data={data} submitting={submitting} capturing={capturing} />
				<BlockNumPad auto={auto} data={data} submitting={submitting} reset={reset} capture={capture} onNumPadClick={onNumPadClick} />
				<BlockConfirm submitting={submitting} data={data} onConfirm={onConfirm} />
				<BlockIO submitting={submitting} data={data} onFinish={onFinish} />

			</>}
		</Container>
	</>
	);
}