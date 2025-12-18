import React, { useEffect, useState, Suspense, lazy, useContext } from 'react';
import { Route, Routes, useRoutes, BrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Button, Spin, Form, Space, Input, InputNumber, Tooltip, Menu, Collapse, Typography, Modal, Select, Tag, DatePicker, Alert, Drawer, Checkbox } from "antd";
import { Container, Row, Col } from 'react-grid-system';
import styled from 'styled-components';
import { EnterOutlined, RedoOutlined, WarningTwoTone } from '@ant-design/icons';
import Webcam from "react-webcam";
import { useSubmitting } from "utils";
import { API_URL } from "config";
import { fetch, fetchPost, cancelToken } from "utils/fetch";

const StyledButton = styled(Button)`
	font-weight:700;
	width:60px!important;
`;


const videoConstraints = {
	width: 1280,
	height: 720,
	facingMode: "user"
};

export default ({ }) => {
	const submitting = useSubmitting(false);
	const [num, setNum] = useState('');
	const [nome, setNome] = useState('');
	const [error, setError] = useState({ status: false, text: '' });
	const [snapshot, setSnapshot] = useState();

	const webcamRef = React.useRef(null);
	const capture = React.useCallback(
		async () => {

			const imageSrc = webcamRef.current.getScreenshot();
			setSnapshot(imageSrc);
			submitting.trigger();
			try {
				const vals = { num: `F${num.padStart(5, '0')}` };
				console.log(vals);
				let response = await fetchPost({ url: `${API_URL}/rponto/sql/`, filter: { ...vals }, parameters: { method: "SetUser" } });
				if (response.data.status !== "error" && response.data?.rows?.length > 0) {
					setNome(`${response.data.rows[0].SRN_0} ${response.data.rows[0].NAM_0}`);
				} else {
					setError({ status: true, text: "O número que indicou não existe!" });
					submitting.end();
				}
			} catch (e) {
				setError({ status: true, text: e.message });
				submitting.end();
			};

		},
		[webcamRef, num]
	);

	const reset = () => {
		setNum('');
		setSnapshot(null);
		setNome("");
		setError({ status: false, text: "" });
	}

	const onClick = (v) => {
		if (v === "C") {
			setNum('');
		} else if (v === "ENTER") {

		} else {
			if (num.length < 3) {
				setNum(prev => `${prev}${v}`);
			}
		}
	}



	return (<>
		<Container style={{ fontWeight: 700 }}>
			<Row gutterWidth={2} style={{ height: "188px" }}>
				<Col></Col>
				<Col xs="content" style={{}}>
					{!snapshot && <Webcam
						audio={false}
						height={180}
						ref={webcamRef}
						screenshotFormat="image/jpeg"
						width={320}
						videoConstraints={videoConstraints}
					/>}
					{snapshot && <img src={snapshot} />}
				</Col>
				<Col></Col>
			</Row>
			<Row gutterWidth={2} style={{ height: "50px", marginBottom: "10px" }}>
				<Col></Col>
				<Col xs="content" style={{ fontSize: "40px" }}>{num}</Col>
				<Col></Col>
			</Row>
			{!snapshot && <><Row gutterWidth={2}>
				<Col></Col>
				<Col xs="content"><StyledButton onClick={() => onClick(1)} size="large">1</StyledButton></Col>
				<Col xs="content"><StyledButton onClick={() => onClick(2)} size="large">2</StyledButton></Col>
				<Col xs="content"><StyledButton onClick={() => onClick(3)} size="large">3</StyledButton></Col>
				<Col></Col>
			</Row>
				<Row gutterWidth={2}>
					<Col></Col>
					<Col xs="content"><StyledButton onClick={() => onClick(4)} size="large">4</StyledButton></Col>
					<Col xs="content"><StyledButton onClick={() => onClick(5)} size="large">5</StyledButton></Col>
					<Col xs="content"><StyledButton onClick={() => onClick(6)} size="large">6</StyledButton></Col>
					<Col></Col>
				</Row>
				<Row gutterWidth={2}>
					<Col></Col>
					<Col xs="content"><StyledButton onClick={() => onClick(7)} size="large">7</StyledButton></Col>
					<Col xs="content"><StyledButton onClick={() => onClick(8)} size="large">8</StyledButton></Col>
					<Col xs="content"><StyledButton onClick={() => onClick(9)} size="large">9</StyledButton></Col>
					<Col></Col>
				</Row>
				<Row gutterWidth={2}>
					<Col></Col>
					<Col xs="content"><StyledButton disabled={snapshot} onClick={() => onClick('C')} size="large">C</StyledButton></Col>
					<Col xs="content"><StyledButton onClick={() => onClick(0)} size="large">0</StyledButton></Col>
					<Col xs="content">
						{!snapshot && <StyledButton disabled={!parseInt(num)} onClick={capture} icon={<EnterOutlined />} size="large" />}
						{snapshot && <StyledButton onClick={reset} icon={<RedoOutlined />} size="large" />}
					</Col>
					<Col></Col>
				</Row>
			</>}
			{nome && <>
				<Row>
					<Col></Col>
					<Col xs="content" style={{ fontWeight: 200, fontSize: "30px" }}>Olá {nome}</Col>
					<Col></Col>
				</Row>
				<Row style={{ margin: "20px 0px" }} gutterWidth={5}>
					<Col></Col>
					<Col xs="content"><Button>Estou a Entrar</Button></Col>
					<Col xs="content"><Button>Estou a Sair</Button></Col>
					<Col></Col>
				</Row>
				<Row>
					<Col></Col>
					<Col xs="content"><Button type='link' size="large" onClick={reset} style={{}}>Eu não sou {nome}</Button></Col>
					<Col></Col>
				</Row>
			</>}
			{error.status === true && <Row gutterWidth={2} style={{ alignItems: "center", fontWeight: 400 }}>
				<Col></Col>
				<Col xs="content">
					<Alert
						message="Erro no registo"
						showIcon
						description={error.text}
						type="error"
						action={<Button onClick={reset} size="small" type="link" danger>Tentar novamente</Button>}
					/>
				</Col>
				<Col></Col>
			</Row>}
		</Container>
	</>
	);
}