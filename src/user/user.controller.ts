import {
  Post,
  Body,
  Controller,
  Res,
  ValidationPipe,
  UseFilters,
  //   UseInterceptors,
  //   UploadedFile,
  Get,
  Req,
  UseGuards,
  ForbiddenException,
  Query,
  Param,
  // Param,
} from '@nestjs/common';
import {
  GetAllUsersResponseDto,
  //   ImageResponseDto,
  LoginUserResponseDto,
  SignUpDto,
  UserLoginDto,
} from '../dto/user.dto';
import { UserService } from './user.service';
import { GlobalExceptionFilter } from '../global-exception.filter';
// import { FileInterceptor } from '@nestjs/platform-express';
// import * as multer from 'multer';
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
  // @UseInterceptors(FileInterceptor('profilePic'))
  async signUp(
    @Body(new ValidationPipe()) signUpDto: SignUpDto,
    // @UploadedFile() profilePic: multer.File,
    @Res() res,
  ): Promise<void> {
    // console.log(profilePic);
    const response = await this.userService.createUser(signUpDto);
    res.status(response.statusCode).json(response);
  }
  //   @Post('upload')
  //   @UseInterceptors(FileInterceptor('image'))
  //   async uploadImage(
  //     @UploadedFile() image: multer.File,
  //   ): Promise<ImageResponseDto> {
  //     return await this.userService.uploadImage(image);
  //   }
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

  @Get('users/:userId')
  @UseGuards(JwtAuthGuard)
  async getUserByIdByAdmin(
    @Param('userId') userId: string,
    @Req() req,
  ): Promise<LoginUserResponseDto> {
    const userType = req.user.userType;

    // Check if the user is an admin
    if (userType !== 'admin') {
      throw new ForbiddenException('Only admins can access this resource');
    }

    // Fetch user by ID
    return this.userService.getUserByIdForAdmin(userId);
  }
  /*
    used fetch all users
    only admin can perform this action
    Postman Endpoint: GET: {{url}}/user/all
     */
  @Get('/all')
  @UseGuards(JwtAuthGuard)
  async getAllUsers(
    @Req() req,
    @Query('page') page: number = 1,
  ): Promise<GetAllUsersResponseDto> {
    const userType = req.user.userType;

    // Check if the user is an admin
    if (userType !== 'admin') {
      throw new ForbiddenException('Only admins can access this resource');
    }

    // If the user is an admin, fetch all users
    return this.userService.getAllUsers(page);
  }
}
