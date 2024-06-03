import {
  Post,
  Body,
  Controller,
  Res,
  ValidationPipe,
  UseFilters,
  Get,
  Req,
  UseGuards,
  Query,
  BadRequestException,
  // Param,
} from '@nestjs/common';
import {
  GetAllUsersResponseDto,
  SignUpDto,
  UserLoginDto,
} from '../dto/user.dto';
import { UserService } from './user.service';
import { GlobalExceptionFilter } from '../global-exception.filter';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('user')
@UseFilters(GlobalExceptionFilter)
export class UserController {
  constructor(private userService: UserService) {}

  /*
    used to register a new user
    Postman Endpoint: POST: {{url}}/user/create
     */
  @Post('create')
  async signUp(
    @Body(new ValidationPipe()) signUpDto: SignUpDto,
    @Res() res,
  ): Promise<void> {
    try {
      const response = await this.userService.createUser(signUpDto);
      res.status(response.statusCode).json(response);
    } catch (error) {
      throw error;
    }
  }

  @Get('verify-email')
  async verifyEmail(
    @Query('token') token: string,
  ): Promise<{ success: true; message: string }> {
    try {
      if (token) {
        await this.userService.verifyEmail(token);
        return { success: true, message: 'Email verified successfully' };
      } else {
        throw new BadRequestException('Token does not exist');
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  /*
    used to login a user
    Postman Endpoint: POST: {{url}}/user/login
     */
  @Post('login')
  async login(
    @Body(new ValidationPipe()) userLoginDto: UserLoginDto,
    @Res() res,
  ): Promise<void> {
    const response = await this.userService.login(userLoginDto);
    res.status(response.statusCode).json(response);
  }
  /*
    used to get a user's profile
    Postman Endpoint: GET: {{url}}/user/profile
     */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req) {
    const userId = req.user.userId;
    return this.userService.getUserById(userId);
  }

  /*
    used fetch all users
    only admin can perform this action
    Postman Endpoint: GET: {{url}}/user/all
     */
  @Get('/all')
  @UseGuards(JwtAuthGuard)
  async getAllUsers(): Promise<GetAllUsersResponseDto> {
    return this.userService.getAllUsers();
  }
}
