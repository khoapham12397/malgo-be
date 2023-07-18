import { CorsOptions } from 'cors';

export const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000'
  // TODO: Later we will add the production URL here
];

export const corsOptions: CorsOptions = {
  origin: (
    origin: string | undefined,
    callback: (error: Error | null, allowed?: boolean | undefined) => void
  ) => {
    if (allowedOrigins.indexOf(origin as string) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  optionsSuccessStatus: 200
};
