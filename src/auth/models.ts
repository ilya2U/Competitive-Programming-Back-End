export interface Jwt {
  access_token: string;
}

export interface SignInPayload {
  hash: string;
  username: string;
}
