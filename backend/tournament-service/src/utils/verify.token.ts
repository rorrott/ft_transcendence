//backend/tournament-service/src/utils/verify.token.ts
import axios from 'axios';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:5500/api/v1/auth';

export const verifyToken = async (token: string) => {
	try {
    	const res = await axios.post(`${AUTH_SERVICE_URL}/verify-token`, { token });
        // --- THIS IS THE CRUCIAL LOG ---
        console.log('DEBUG: Auth Service /verify-token successful response.data in tournament-service:', res.data);
        // --- IMPORTANT: Log the type too! ---
        console.log('DEBUG: Type of res.data:', typeof res.data);
	    return res.data; // contains userId, email, etc.
  	} catch (err: any) {
    	const error = new Error('Unauthorized');
    	(error as any).statusCode = 401;
    	throw error;
  	}
};
