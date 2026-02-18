import React, { useEffect, useState, useRef } from 'react';
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
import { DATETIME_FORMAT, STAND_STILL_DURATION, AUTO_SAMPLE_INTERVAL, AUTO_MOTION_TOLERANCE, ON_CONFIRM_TIMEOUT, ON_END_MESSAGE_TIMEOUT, ON_BEFORECONFIRM_TIMEOUT } from 'config';
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

// Improved button styling for better visual appeal
const StyledButton = styled(Button)`
    font-weight: 700;
    width: 50% !important;
    max-width: 150px;
    height: auto !important;
    aspect-ratio: 1 / 0.5;
    font-size: 4vw !important;
    margin: 5px;
    border-radius: 12px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
    &:hover {
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        transform: translateY(-2px);
    }
    &:active {
        transform: translateY(0);
    }
`;

// Enhanced alert styling
const StyledAlert = styled.div`
	.ant-alert{
		display:flex;
		align-items:center;
		border-radius: 12px;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}
	.ant-alert-message{
		font-size:16px;
		margin-bottom:0px;
		font-weight:600;
	}
`;

// Improved spinner with modern look
const Spin = styled.div`
.spinner {
	margin: 5px auto 0;
	width: 70px;
	text-align: center;
  }
  
  .spinner > div {
	width: 18px;
	height: 18px;
	background-color: #1890ff;
	border-radius: 100%;
	display: inline-block;
	animation: sk-bouncedelay 1.4s infinite ease-in-out both;
  }
  
  .spinner .bounce1 {
	animation-delay: -0.32s;
  }
  
  .spinner .bounce2 {
	animation-delay: -0.16s;
  }
  
  .spinner .bounce3 {
	animation-delay: 0s;
  }
  
  @keyframes sk-bouncedelay {
	0%, 80%, 100% { 
	  transform: scale(0);
	} 40% { 
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

// Enhanced wait block with better messaging
const BlockWait = ({ submitting }) => {
	return (<>
		{(submitting.state) &&
			<Row gutterWidth={2} style={{ height: "60px", marginTop: "30px", marginBottom: "30px", alignItems: "center" }}>
				<Col></Col>
				<Col xs="content" style={{ fontWeight: 200, fontSize: "25px", color: "#1890ff" }}>Aguarde um momento <Spinner /></Col>
				<Col></Col>
			</Row>
		}
	</>);
}

// Unchanged function
const fetchclientes = async (signal) => {}

// Improved toolbar with modern design
const Toolbar = ({ data, auto, onAuto }) => {
	return (<>
		{!data.type &&
			<Row gutterWidth={2} style={{ margin: "10px 0px 10px 0px", alignItems: "center" }}>
				<Col>
					<Row nogutter style={{ background: "linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%)", borderRadius: "15px", padding: "15px", display: "flex", alignItems: "center", marginBottom: "30px", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)" }}>
						<Col style={{ textAlign: "left" }}><Logo style={{ width: "100px", height: "16px" }} /></Col>
						<Col style={{ textAlign: "center", fontSize: "24px", fontWeight: 700, color: "#262626" }}>
							{!data.date && data.dateInterval.toLocaleTimeString('pt-PT', {
								hour: '2-digit',
								minute: '2-digit',
								second: '2-digit'
							})}
							{data.date && data.date.toLocaleTimeString('pt-PT', {
								hour: '2-digit',
								minute: '2-digit',
								second: '2-digit'
							})}
						</Col>
						<Col style={{ textAlign: "right", fontWeight: 400, fontSize: "14px", color: "#595959" }}>
							<Row gutterWidth={10}>
								<Col style={{ textAlign: "right", alignSelf: "center" }}>
									{!data.date && data.dateInterval.toLocaleDateString('pt-PT', {
										day: '2-digit',
										month: 'long',
										year: 'numeric'
									})}
									{data.date && data.date.toLocaleDateString('pt-PT', {
										day: '2-digit',
										month: 'long',
										year: 'numeric'
									})}
								</Col>
							</Row>
							<Row gutterWidth={10} style={{ display: "flex", justifyContent: "end" }}>
								<Col xs="content">
									<Button 
										style={{ 
											padding: "8px 12px", 
											borderRadius: "8px", 
											background: auto ? "#ff4d4f" : "#52c41a",
											border: "none",
											color: "white"
										}} 
										onTouchStart={onAuto}
									>
										{auto ? <StopFilled style={{ fontSize: "16px" }} /> : <PlayCircleFilled style={{ fontSize: "16px" }} />}
									</Button>
								</Col>
							</Row>
						</Col>
					</Row>
				</Col>
			</Row>
		}
	</>);
}

// Enhanced error block
const BlockError = ({ submitting, error, reset }) => {
	return (<>
		{error?.status === true && 
			<Row gutterWidth={2} style={{ alignItems: "center", fontWeight: 400, margin: "20px 0" }}>
				<Col></Col>
				<Col xs="content">
					<StyledAlert>
						<Alert
							style={{ 
								margin: "10px 0px", 
								padding: "20px", 
								borderRadius: "12px",
								boxShadow: "0 4px 12px rgba(245, 34, 45, 0.1)"
							}}
							message={<div style={{ fontSize: "18px", fontWeight: 400 }}><span style={{ fontWeight: 700, color: "#ff4d4f" }}>Erro!</span></div>}
							showIcon
							description={<div style={{ fontSize: "16px", color: "#595959" }}>{error?.text}</div>}
							type="error"
							action={
								<Button 
									disabled={submitting.state} 
									onTouchStart={() => !submitting.state && reset()} 
									size="small" 
									fill='none' 
									color='danger'
									style={{ borderRadius: "6px", marginLeft: "10px" }}
								>
									Tentar novamente
								</Button>
							}
						/>
					</StyledAlert>
				</Col>
				<Col></Col>
			</Row>
		}
	</>);
}

// Improved numpad with better spacing and colors
const BlockNumPad = ({ auto, data, submitting, reset, capture, onNumPadClick }) => {
	return (<>
		{(!auto && !submitting.state && !data.error.status) && <>
			<Row gutterWidth={2} style={{ marginTop: "20px", marginBottom: "20px" }}>
				<Col></Col>
				{(!data.snapshot) && 
					<Col xs="content" style={{ 
						fontSize: "24px", 
						fontWeight: 700, 
						color: "#1890ff", 
						textAlign: "center",
						textShadow: "0 1px 2px rgba(0,0,0,0.1)",
						marginBottom: "20px"
					}}>
						Digite o seu número de funcionário
					</Col>
				}
				<Col></Col>
			</Row>
			{(!data.nome) && 
				<Row gutterWidth={2} style={{ marginBottom: "20px" }}>
					<Col></Col>
					<Col xs="content" style={{ 
						minWidth: "454px", 
						fontSize: "40px", 
						border: "3px solid #d9d9d9", 
						borderRadius: "12px", 
						textAlign: "center", 
						padding: "15px",
						background: "#fafafa",
						boxShadow: "inset 0 2px 4px rgba(0,0,0,0.1)"
					}}>
						<span style={{ color: "#8c8c8c" }}>F00</span>{data.num}
					</Col>
					<Col></Col>
				</Row>
			}
			{(!data.snapshot) && <>
				{/* Improved numpad layout with flexbox for better alignment */}
				<div style={{ 
					display: "flex", 
					justifyContent: "center", 
					alignItems: "center", 
					flexDirection: "column",
					gap: "15px",  // Uniform spacing between rows
					margin: "0 auto",
					maxWidth: "400px"  // Constrain width for better centering
				}}>
					<div style={{ display: "flex", gap: "10px" }}>
						<StyledButton 
							disabled={submitting.state} 
							onTouchStart={() => !submitting.state && onNumPadClick(1)} 
							size="large"
							style={{ background: "#f0f0f0", color: "#262626", flex: 1 }}
						>
							1
						</StyledButton>
						<StyledButton 
							disabled={submitting.state} 
							onTouchStart={() => !submitting.state && onNumPadClick(2)} 
							size="large"
							style={{ background: "#f0f0f0", color: "#262626", flex: 1 }}
						>
							2
						</StyledButton>
						<StyledButton 
							disabled={submitting.state} 
							onTouchStart={() => !submitting.state && onNumPadClick(3)} 
							size="large"
							style={{ background: "#f0f0f0", color: "#262626", flex: 1 }}
						>
							3
						</StyledButton>
					</div>
					<div style={{ display: "flex", gap: "10px" }}>
						<StyledButton 
							disabled={submitting.state} 
							onTouchStart={() => !submitting.state && onNumPadClick(4)} 
							size="large"
							style={{ background: "#f0f0f0", color: "#262626", flex: 1 }}
						>
							4
						</StyledButton>
						<StyledButton 
							disabled={submitting.state} 
							onTouchStart={() => !submitting.state && onNumPadClick(5)} 
							size="large"
							style={{ background: "#f0f0f0", color: "#262626", flex: 1 }}
						>
							5
						</StyledButton>
						<StyledButton 
							disabled={submitting.state} 
							onTouchStart={() => !submitting.state && onNumPadClick(6)} 
							size="large"
							style={{ background: "#f0f0f0", color: "#262626", flex: 1 }}
						>
							6
						</StyledButton>
					</div>
					<div style={{ display: "flex", gap: "10px" }}>
						<StyledButton 
							disabled={submitting.state} 
							onTouchStart={() => !submitting.state && onNumPadClick(7)} 
							size="large"
							style={{ background: "#f0f0f0", color: "#262626", flex: 1 }}
						>
							7
						</StyledButton>
						<StyledButton 
							disabled={submitting.state} 
							onTouchStart={() => !submitting.state && onNumPadClick(8)} 
							size="large"
							style={{ background: "#f0f0f0", color: "#262626", flex: 1 }}
						>
							8
						</StyledButton>
						<StyledButton 
							disabled={submitting.state} 
							onTouchStart={() => !submitting.state && onNumPadClick(9)} 
							size="large"
							style={{ background: "#f0f0f0", color: "#262626", flex: 1 }}
						>
							9
						</StyledButton>
					</div>
					<div style={{ display: "flex", gap: "10px" }}>
						<StyledButton 
							style={{ color: "#ff4d4f", background: "#fff2f0", border: "2px solid #ffccc7", flex: 1 }} 
							disabled={data.snapshot || submitting.state} 
							onTouchStart={() => !(data.snapshot || submitting.state) && onNumPadClick('C')} 
							size="large"
						>
							C
						</StyledButton>
						<StyledButton 
							disabled={submitting.state} 
							onTouchStart={() => !submitting.state && onNumPadClick(0)} 
							size="large"
							style={{ background: "#f0f0f0", color: "#262626", flex: 1 }}
						>
							0
						</StyledButton>
						{!data.snapshot && 
							<StyledButton 
								disabled={!parseInt(data.num) || submitting.state} 
								onTouchStart={() => !(!parseInt(data.num) || submitting.state) && capture()} 
								size="large"
								style={{ background: "#1890ff", color: "white", flex: 1 }}
							>
								<CameraTwoTone style={{ fontSize: "48px" }} />
							</StyledButton>
						}
						{data.snapshot && 
							<StyledButton 
								disabled={submitting.state} 
								onTouchStart={() => !submitting.state && reset()} 
								icon={<RedoOutlined />} 
								size="large"
								style={{ background: "#faad14", color: "white", flex: 1 }}
							/>
						}
					</div>
				</div>
			</>}
		</>
		}
	</>);
}


// Enhanced confirm block with better buttons
const BlockConfirm = ({ submitting, data, onConfirm }) => {
	return (<>
		{(!submitting.state && !data.error.status) && <>
			<Row gutterWidth={2} style={{ marginTop: "40px", marginBottom: "20px" }}>
				<Col></Col>
				{(data.level == 1 && data.nome) && 
					<Col xs="content" style={{ 
						fontWeight: 200, 
						fontSize: "28px", 
						display: "flex", 
						flexDirection: "column", 
						alignItems: "center",
						color: "#262626",
						textAlign: "center"
					}}>
						Confirma que é 
						<div style={{ fontWeight: 600, marginTop: "10px", color: "#1890ff" }}>
							{data.nome}
						</div>?
					</Col>
				}
				<Col></Col>
			</Row>
			{(data.level == 1 && data.nome) && <>
				<Row style={{ margin: "30px 0px" }} gutterWidth={25}>
					<Col></Col>
					<Col xs="content">
						<Button 
							disabled={submitting.state} 
							onTouchStart={() => !submitting.state && onConfirm(true)} 
							shape='circle' 
							style={{ 
								border: "none", 
								minWidth: "140px", 
								minHeight: "140px", 
								background: "#52c41a", 
								color: "#fff",
								boxShadow: "0 6px 16px rgba(82, 196, 26, 0.3)",
								transition: "all 0.2s ease"
							}}
						>
							<CheckCircleOutlined style={{ fontSize: "80px" }} />
						</Button>
					</Col>
					<Col xs="content">
						<Button 
							disabled={submitting.state} 
							onTouchStart={() => !submitting.state && onConfirm(false)} 
							shape='circle' 
							style={{ 
								border: "none", 
								minWidth: "140px", 
								minHeight: "140px", 
								background: "#ff4d4f", 
								color: "#fff",
								boxShadow: "0 6px 16px rgba(255, 77, 79, 0.3)",
								transition: "all 0.2s ease"
							}}
						>
							<CloseCircleOutlined style={{ fontSize: "80px" }} />
						</Button>
					</Col>
					<Col></Col>
				</Row>
			</>}
		</>
		}
	</>);
}

// Enhanced IO block with better buttons
const BlockIO = ({ submitting, data, onFinish }) => {
	return (<>
		{(!submitting.state && !data.error.status) && <>
			<Row gutterWidth={2} style={{ marginTop: "40px", marginBottom: "20px" }}>
				<Col></Col>
				{(data.level == 2 && data.nome) && 
					<Col xs="content" style={{ 
						fontWeight: 200, 
						fontSize: "28px", 
						display: "flex", 
						flexDirection: "column", 
						alignItems: "center",
						color: "#262626",
						textAlign: "center"
					}}>
						Olá,
						<div style={{ fontWeight: 600, marginTop: "10px", color: "#1890ff" }}>
							{data.nome}
						</div>
					</Col>
				}
				<Col></Col>
			</Row>
			{(data.level == 2 && data.nome) && <>
				<Row style={{ margin: "30px 0px" }} gutterWidth={25}>
					<Col></Col>
					<Col xs="content">
						<Button 
							disabled={submitting.state} 
							onTouchStart={() => !submitting.state && onFinish('in')}  
							shape="circle" 
							style={{ 
								minWidth: "140px", 
								minHeight: "140px", 
								background: "#52c41a", 
								color: "#fff", 
								fontSize: "20px",
								fontWeight: 700,
								boxShadow: "0 6px 16px rgba(82, 196, 26, 0.3)",
								transition: "all 0.2s ease"
							}}
						>
							Entrada
						</Button>
					</Col>
					<Col xs="content">
						<Button 
							disabled={submitting.state} 
							onTouchStart={() => !submitting.state && onFinish("out")}  
							shape="circle" 
							style={{ 
								minWidth: "140px", 
								minHeight: "140px", 
								background: "#ff4d4f", 
								color: "#fff", 
								fontSize: "20px",
								fontWeight: 700,
								boxShadow: "0 6px 16px rgba(255, 77, 79, 0.3)",
								transition: "all 0.2s ease"
							}}
						>
							Saída
						</Button>
					</Col>
					<Col></Col>
				</Row>
			</>}
		</>
		}
	</>);
}

// Enhanced message block
const BlockMessage = ({ data, reset }) => {
	return (<>
		{data.type &&
			<Row nogutter style={{ height: "70vh", display: "flex", alignItems: "center" }}>
				<Col>
					<Row>
						<Col></Col>
						<Col xs="content" style={{ 
							fontWeight: 200, 
							fontSize: "32px", 
							color: "#262626",
							textAlign: "center",
							padding: "20px",
							borderRadius: "12px",
							background: "#f6ffed",
							border: "2px solid #b7eb8f",
							boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
						}}>
							<div dangerouslySetInnerHTML={{ __html: data.type == "in" ? data.config?.MESSAGE_IN : data.config?.MESSAGE_OUT }}></div>
						</Col>
						<Col></Col>
					</Row>
					<Row style={{ marginTop: "30px" }}>
						<Col></Col>
						<Col xs="content">
							<Button 
								fill="none" 
								color='primary' 
								size="large" 
								onTouchStart={reset} 
								style={{ 
									borderRadius: "8px",
									fontSize: "18px",
									padding: "12px 24px",
									boxShadow: "0 4px 8px rgba(24, 144, 255, 0.3)"
								}}
							>
								Novo Registo
							</Button>
						</Col>
						<Col></Col>
					</Row>
				</Col>
			</Row>
		}
	</>);
}

// Enhanced photo block with better styling
const BlockFoto = ({ data }) => {
    return (<>
        {((data.level == 1 || data.level == 2) && data.recon && data.foto !== null) && 
            <img 
                style={{ 
                    borderRadius: "12px", 
                    maxHeight: "25vh",
                    width: "auto",      
                    maxWidth: "100%",   
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    marginTop: "15px",
                    border: "3px solid #52c41a"
                }} 
                src={data.foto} 
                alt="Foto do utilizador"
            />
        }
        {(((data.level == 1 || data.level == 2) && data.foto === null && data.recon) || (data.level == 2 && !data.recon)) && 
            <div style={{
                borderRadius: "12px",
                maxHeight: "25vh",
                width: "200px",
                height: "200px",
                background: "#f0f0f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                marginTop: "15px",
                color: "#8c8c8c",
                fontSize: "16px"
            }}>
                Sem foto
            </div>
        }
    </>);
}

// Enhanced snapshot block
const BlockSnapshot = ({ data }) => {
    return (<>
        {((data.level == 0 || data.level == 1) && data.snapshot && !data.recon) && 
            <img 
                style={{ 
                    borderRadius: "12px", 
                    maxHeight: "24vh", 
                    width: "auto", 
                    maxWidth: "100%",
                    border: "3px solid #1890ff",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    marginTop: "10px"
                }} 
                src={data.snapshot} 
                alt="Captura da câmera"
            />
        }
    </>);
}

// Enhanced identity block
const BlockIdentity = ({ data }) => {
	return (<>
		{(data.level == 1 && !data.recon && data.valid_names.length > 0) &&
			<Alert
				style={{ 
					margin: "15px 0px", 
					padding: "20px",
					borderRadius: "12px",
					boxShadow: "0 4px 12px rgba(250, 173, 20, 0.1)"
				}}
				message={<div style={{ fontSize: "18px", fontWeight: 400 }}><span style={{ fontWeight: 700, color: "#faad14" }}>Aviso!</span> O sistema identificou-o(a) como:</div>}
				description={<>
					{data.valid_names.map(v => {
						return (<div key={`U-${v.REFNUM_0}`}>
							<div style={{ 
								marginTop: "10px", 
								fontSize: "18px", 
								fontWeight: 600,
								color: "#262626",
								background: "#fffbe6",
								padding: "8px",
								borderRadius: "6px"
							}}>
								<span style={{ fontWeight: 400 }}>{v.REFNUM_0}</span> <span>{`${v.SRN_0} ${v.NAM_0.toLowerCase().replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())}`}</span>
							</div>
						</div>);
					})}
				</>}
				type="warning"
				showIcon
			/>}
		{(data.level == 1 && !data.recon && data.valid_names.length === 0) &&
			<Alert
				style={{ 
					margin: "15px 0px", 
					padding: "20px",
					borderRadius: "12px",
					boxShadow: "0 4px 12px rgba(250, 173, 20, 0.1)"
				}}
				message={<div style={{ fontSize: "18px", fontWeight: 400 }}><span style={{ fontWeight: 700, color: "#faad14" }}>Aviso!</span></div>}
				description={<div style={{ marginTop: "10px", fontSize: "16px", fontWeight: 400, color: "#595959" }}>O sistema não o(a) identificou!</div>}
				type="warning"
				showIcon
			/>}
	</>);
}

// Enhanced webcam block with better styling
const BlockWebcam = React.forwardRef(({ auto, data, boundingBox }, ref) => {
    return (<>
        <div style={{ display: data.snapshot && "none", textAlign: 'center' }}>
            <Webcam
                minScreenshotWidth={1280}
                minScreenshotHeight={720}
                audio={false}
                ref={ref}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                style={{ 
                    borderRadius: "15px", 
                    width: "100%",      
                    height: "auto", 
                    maxHeight: "30vh",
                    objectFit: "cover",
                    background: "#000",
                    border: "4px solid #1890ff",
                    boxShadow: "0 6px 16px rgba(24, 144, 255, 0.2)"
                }}
            />
        </div>
    </>);
});

// Enhanced standstill message
const BlockMessageStandStill = ({ submitting, data, auto, capturing, standStillCounter }) => {
	return (
		<>
			{(auto && data.level == 0 && capturing && !submitting.state && !data.error.status) &&
				<Row gutterWidth={2} style={{ marginTop: "30px", marginBottom: "30px", alignItems: "center" }}>
					<Col></Col>
					<Col xs="content" style={{ 
						fontWeight: 200, 
						fontSize: "26px", 
						display: "flex", 
						flexDirection: "column", 
						alignItems: "center",
						color: "#1890ff",
						textAlign: "center",
						background: "#e6f7ff",
						padding: "20px",
						borderRadius: "12px",
						border: "2px solid #91d5ff",
						boxShadow: "0 4px 12px rgba(24, 144, 255, 0.1)"
					}}>
						Por favor, <span style={{ fontWeight: 700 }}>permaneça imóvel</span> em frente à câmera por {standStillCounter - 1} segundos...
					</Col>
					<Col></Col>
				</Row>
			}
		</>
	);
}

// Enhanced auto capture block
const BlockCaptureAuto = ({ auto, onCaptureAuto, capturing, data, submitting }) => {
	return (<>
		{(auto && data.level == 0 && !capturing && !submitting.state && !data.error.status) &&
			<Row style={{ marginTop: "30px" }}>
				<Col>
					<Button 
						style={{
							height:"280px",
							borderRadius: "15px",
							background: "#1890ff",
							color: "white",
							fontSize: "24px",
							fontWeight: 700,
							boxShadow: "0 6px 16px rgba(24, 144, 255, 0.3)",
							transition: "all 0.2s ease"
						}} 
						block 
						onTouchStart={onCaptureAuto}
						size="large"
					>
						<CameraTwoTone style={{ fontSize: "60px", marginBottom: "10px" }} />
						<br />
						Capturar Automaticamente
					</Button>
				</Col>
			</Row>
		}
	</>);
}

// Rest of the code remains unchanged for functionality
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
	const submitting = useSubmitting(false);
	const webcamRef = React.useRef(null);
	const timeout = React.useRef(null);
	const beforeConfirmTimeout = React.useRef(null);
	const [capturing, setCapturing] = useState(false);
	const [standStillCounter, setStandStillCounter] = useState(STAND_STILL_DURATION + 1);
	const standStillTimer = React.useRef(null);
	const autoTimer = React.useRef(null);
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
	useEffect(() => {
		const interval = loadInterval();
		return (() => { clearInterval(interval); });
	}, []);


	useEffect(() => {
		if (auto && detected && !autoTriggered.current) {
			autoTriggered.current=true;
			onCaptureAuto();
		}
	}, [detected]);

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
		setStandStillCounter(STAND_STILL_DURATION + 1);
		clearTimer(standStillTimer, false);
		setCapturing(false);
		const imageSrc = webcamRef.current.getScreenshot();
		submitting.trigger();
		try {
			const vals = {};
			const _ds = data.dateInterval
			updateData(draft => {
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
		} else {
			clearTimer(beforeConfirmTimeout);
			clearTimer(autoTimer);
			clearTimer(standStillTimer, false);
			setCapturing(false);
		}
		setAuto(prev => !prev);
	}

	return (<>
		<Container fluid style={{ fontWeight: 700, background: "#fafafa", minHeight: "100vh", padding: "20px" }}>
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