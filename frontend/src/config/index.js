import React from 'react';
export const ROOT_URL = "http://localhost:8000";
export const FILES_URL = "http://localhost:8000";
//export const ROOT_URL = "https://192.168.0.16";
//export const FILES_URL = "https://192.168.0.16";
export const CSRF = document.cookie.replace("csrftoken=", "");
export const MAX_UPLOAD_SIZE = 5; //MB
export const API_URL = "/api";
export const DOWNLOAD_URL = "/downloadfile";
export const MEDIA_URL = "/media";
export const DADOSBASE_URL = `${API_URL}/dadosbase`;
export const DATE_FORMAT = 'YYYY-MM-DD';
export const DATE_FORMAT_NO_SEPARATOR = 'YYYYMMDD';
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
export const TIME_FORMAT = 'HH:mm';
export const PAGE_TOOLBAR_HEIGHT = "45px";
export const SOCKET = { url: 'ws://localhost:8000/ws' };
export const SCREENSIZE_OPTIMIZED = { width: 1920, height: 1080 }
export const ON_CONFIRM_TIMEOUT = 10000;//milliseconds
export const ON_BEFORECONFIRM_TIMEOUT = 15000;//milliseconds
export const ON_END_MESSAGE_TIMEOUT = 20000;//millisecondes
export const AUTO_SAMPLE_INTERVAL = 1000;//milliseconds
export const STAND_STILL_DURATION = 0; //in seconds
export const AUTO_MOTION_TOLERANCE = 200;//higher more tolerant