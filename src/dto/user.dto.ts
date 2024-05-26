import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
  IsOptional,
} from 'class-validator';
import { User } from 'src/schemas/user.schema';

function omitProperties<T extends Record<string, any>>(
  obj: T,
  keysToOmit: Array<keyof T>,
): Partial<T> {
  const result: Partial<T> = {};
  for (const key in obj) {
    if (!keysToOmit.includes(key)) {
      result[key] = obj[key];
    }
  }
  return result;
}

//Signup Dto

export class SignUpDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^[^@]+$/, {
    message: 'username: Username cannot contain "@" symbol',
  })
  readonly username: string;

  @IsNotEmpty()
  @IsEmail({}, { message: 'Please enter correct email' })
  readonly email: string;

  @IsNotEmpty()
  @IsString({ message: 'firstName: firstName must be a string' })
  readonly firstName: string;

  @IsOptional()
  @IsString({ message: 'lastname: lastname must be a string' })
  readonly lastName: string;

  @IsOptional()
  @IsString({ message: 'password: Password must be a string' })
  @MinLength(5, {
    message: 'password: Password must be at least 5 characters long',
  })
  readonly password?: string;

  @IsOptional()
  @IsString({ message: 'isActive: isActive must be a string' })
  isActive: string;

  @IsNotEmpty()
  @IsString({ message: 'profilePic: profilePic must be a string' })
  profilePic: string;

  constructor(signUpDto: SignUpDto) {
    Object.assign(this, signUpDto);
    if (!this.password) {
      // Generate a random password if password field is empty
      this.password = this.generateRandomPassword(8); // Default length of 8 characters
    }
  }

  private generateRandomPassword(length: number): string {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return password;
  }
}

//Login Dto

export class UserLoginDto {
  @IsNotEmpty()
  @IsString()
  emailOrUsername: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  readonly username?: string;

  @IsString()
  @IsOptional()
  readonly email?: string;

  @IsString()
  @IsOptional()
  readonly firstName?: string;

  @IsString()
  @IsOptional()
  readonly lastName?: string;

  @IsString()
  @IsOptional()
  readonly password?: string;

  @IsString()
  @IsOptional()
  profilePic?: string;

  createdAt?: any;
  updatedAt?: any;
}

/*
  Response DTO
  */

export class CreateUserResponseDto {
  constructor(
    public success: boolean,
    public message: string,
    public statusCode: number,
    public user?: Partial<User>,
    public token?: string,
  ) {
    if (user) {
      // Omit specified properties from the user object
      this.user = omitProperties(user, [
        'password',
        'isActive',
        '__v',
      ]) as Partial<User>;
    }
  }
}

export class LoginUserResponseDto {
  constructor(
    public success: boolean,
    public message: string,
    public statusCode: number,
    public user?: Partial<User>,
    public token?: string,
  ) {
    if (user) {
      // Omit specified properties from the user object
      this.user = omitProperties(user, [
        'password',
        'isActive',
        '__v',
      ]) as Partial<User>;
    }
  }
}

export class GetAllUpdateResponseDto {
  constructor(
    public success: boolean,
    public message: string,
    public statusCode: number,
    public totalUsers?: number,
    public password?: any,
    public users?: User[],
  ) {}
}
export class GetAllUsersResponseDto {
  constructor(
    public success: boolean,
    public message: string,
    public statusCode: number,
    public paginationInfo: {
      totalUsers: number;
      totalPages: number;
      currentPage: number;
    },
    public users?: User[],
  ) {}
}

export class ImageResponseDto {
  constructor(
    public success: boolean,
    public message: string,
    public statusCode: number,
    public image: string,
  ) {}
}

export class DropdownSearchUserDto {
  constructor(
    public fullName: string,
    public profilePic: string,
    public userId: string,
  ) {}
}
