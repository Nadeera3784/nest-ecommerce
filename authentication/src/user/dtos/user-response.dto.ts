export class UserResponseDto {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export class UsersListResponseDto {
  users: UserResponseDto[];
  total: number;
  limit: number;
  skip: number;
}

