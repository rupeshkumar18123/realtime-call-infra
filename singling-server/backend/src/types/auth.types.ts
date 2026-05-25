export interface JwtPayload {
  sub: string;       // user ID
  username: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  expiresIn: string;
}
