import auth0 from 'auth0';
import dotenv from 'dotenv';
dotenv.config();
const auth0Client = new auth0.AuthenticationClient({
  domain: process.env.AUTH0_DOMAIN as string,
  clientId: process.env.AUTH0_CLIENT_ID as string,
  clientSecret: process.env.AUTH0_CLIENT_SECRET as string
});

export default auth0Client;
