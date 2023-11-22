export interface CreateUserRequestDto {
  avatar: string;
  hash: string;
  username: string;
}

export interface CreateUserResponseDto {
  uuid: string;
}
