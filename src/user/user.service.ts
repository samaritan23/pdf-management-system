import {
  BadRequestException,
  Injectable,
  // InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { validate } from 'class-validator';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';
import * as jwt from 'jsonwebtoken';
// import { S3 } from 'aws-sdk';
// import * as multer from 'multer';

import {
  CreateUserResponseDto,
  GetAllUsersResponseDto,
  //   ImageResponseDto,
  LoginUserResponseDto,
  SignUpDto,
  UserLoginDto,
} from '../dto/user.dto';
import { User } from '../schemas/user.schema';

// import uploadToS3 from '../utils/s3';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}
  /*
    Register User Function 
    */

  async createUser(
    signUpDto: SignUpDto,
    // profilePic: multer.File,
  ): Promise<CreateUserResponseDto> {
    try {
      const validationErrors = await validate(signUpDto);

      if (validationErrors.length > 0) {
        const errorMessages = validationErrors
          .map((error) => Object.values(error.constraints))
          .flat()
          .join(', ');
        console.log('Validation errors:', errorMessages);
        throw new BadRequestException(errorMessages);
      }
      //   await this.checkS3BucketExistence();
      const { username, email, password, firstName, lastName, profilePic } =
        signUpDto;
      console.log('Profile picture received:', profilePic);
      const originalpw = password;

      const hashedPassword = await bcrypt.hash(password, 10);

      //   Save profile picture to S3
      // const profilePicUrl = await uploadToS3(profilePic);

      const user = await this.userModel.create({
        username,
        email,
        firstName,
        lastName,
        password: hashedPassword,
        profilePic,
      });

      const fullName = `${firstName} ${lastName}`;
      const { _id, ...userData } = user.toObject();
      const modifiedUser = {
        userId: _id.toString(),
        originalpw,
        fullName,
        profilePic,
        ...userData,
      };
      return new CreateUserResponseDto(
        true,
        'User created successfully',
        201,
        modifiedUser,
      );
    } catch (error) {
      console.error('Error in createUser:', error);
      throw error;
    }
  }

  //   async uploadImage(image: multer.File): Promise<ImageResponseDto> {
  //     try {
  //       // Save the image to S3 and get the URL
  //       const imageUrl = await uploadToS3(image);
  //       console.log(imageUrl);
  //       const imagePath = imageUrl.Location;
  //       const filename = imagePath.substring(imagePath.lastIndexOf('/') + 1);
  //       // const galleryEntry = new this.galleryModel({
  //       //   imageUrl: filename,
  //       //   uploadedAt: Math.floor(Date.now() / 1000),
  //       // });
  //       // await galleryEntry.save();
  //       const response = new ImageResponseDto(
  //         true,
  //         'Image uploaded successfully',
  //         200,
  //         filename || ' ',
  //       );

  //       return response;
  //     } catch (error) {
  //       console.error('Error uploading image:', error);
  //       throw error;
  //     }
  //   }

  /*
    Login User Function 
    */
  async login(userLoginDto: UserLoginDto): Promise<LoginUserResponseDto> {
    const { emailOrUsername, password } = userLoginDto;

    // Check if the provided identifier is an email or a username
    const isEmail = emailOrUsername.includes('@');
    const user = await this.findUserByEmailOrUsername(emailOrUsername, isEmail);

    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }

    const token = this.generateToken(user);
    console.log('user', user);
    console.log('fname', user.firstName);
    const fullName = `${user.firstName} ${user.lastName}`;
    const { _id, ...userData } = user.toObject();
    const modifiedUser = { userId: _id.toString(), fullName, ...userData };

    return new LoginUserResponseDto(
      true,
      'User logged in successfully',
      200,
      modifiedUser,
      token,
    );
  }
  /*
    Get user by ID Function 
    */
  async getUserById(userId: string): Promise<LoginUserResponseDto> {
    const user = await this.userModel.findById(userId, {
      password: 0,
      __v: 0,
      isActive: 0,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const fullName = `${user.firstName} ${user.lastName}`;
    const modifiedUser = {
      userId: user._id.toString(),
      fullName: fullName,
      ...user.toObject(),
      _id: undefined,
    };
    return new LoginUserResponseDto(
      true,
      'Fetched User Data Successfully ',
      200,
      modifiedUser,
    );
  }

  async getUserByIdForAdmin(userId: string): Promise<LoginUserResponseDto> {
    // Find the user by ID
    const user = await this.userModel.findById(userId, {
      password: 0,
      __v: 0,
      isActive: 0,
    });

    // If user not found, throw NotFoundException
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prepare response DTO
    const fullName = `${user.firstName} ${user.lastName}`;
    const modifiedUser = {
      userId: user._id.toString(),
      fullName: fullName,
      ...user.toObject(),
      _id: undefined,
    };

    // Return the user data
    return new LoginUserResponseDto(
      true,
      'Fetched User Data Successfully',
      200,
      modifiedUser,
    );
  }
  /*
    Get All users Function 
    Only admin can get all users
    */
  async getAllUsers(page: number): Promise<GetAllUsersResponseDto> {
    console.log('entering get all');
    const perPage = 10;
    const skip = (page - 1) * perPage;

    const users = await this.userModel
      .find({ isActive: true }, { password: 0, __v: 0, isActive: 0 })
      .skip(skip)
      .limit(perPage)
      .lean();

    console.log('Users:', users);
    const totalUsers = await this.userModel.countDocuments({ isActive: true });
    const totalPages = Math.ceil(totalUsers / perPage);

    const modifiedUsers = users.map((user) => {
      const fullName = `${user.firstName} ${user.lastName}`;
      return { ...user, userId: user._id.toString(), _id: undefined, fullName };
    });

    return new GetAllUsersResponseDto(
      true,
      'Fetched all users successfully',
      200,
      {
        totalUsers,
        totalPages,
        currentPage: page || 1,
      },
      modifiedUsers,
    );
  }

  async findUserByEmailOrUsername(
    emailOrUsername: string,
    isEmail: boolean,
  ): Promise<User | null> {
    if (isEmail) {
      return this.userModel.findOne({ email: emailOrUsername });
    } else {
      return this.userModel.findOne({ username: emailOrUsername });
    }
  }

  generateToken(user: User): string {
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '2d',
      },
    );
    return token;
  }
}
