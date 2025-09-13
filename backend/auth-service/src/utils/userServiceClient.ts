//backend/auth-service/src/utils/userServiceClient.ts
import axios from 'axios';

export const userServiceClient = axios.create({
	baseURL: process.env.USER_SERVICE_URL || 'http://user-service:5501/api/v1/user',
	timeout: 5000,
	headers: {
		'Content-Type': 'application/json',
	},
});
