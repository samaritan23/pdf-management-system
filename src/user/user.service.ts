import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { validate } from 'class-validator';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import * as nodemailer from 'nodemailer';
import { google } from 'googleapis';
const OAuth2 = google.auth.OAuth2;
import {
  CreateUserResponseDto,
  GetAllUsersResponseDto,
  LoginUserResponseDto,
  SignUpDto,
  UserLoginDto,
} from '../dto/user.dto';
import { User } from '../schemas/user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}
  /*
    Register User Function 
    */

  createTransporter = async () => {
    const oauth2Client = new OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      'https://developers.google.com/oauthplayground',
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.REFRESH_TOKEN,
    });

    try {
      const accessToken = await oauth2Client.getAccessToken();

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: process.env.EMAIL,
          accessToken: accessToken.token,
          clientId: process.env.CLIENT_ID,
          clientSecret: process.env.CLIENT_SECRET,
          refreshToken: process.env.REFRESH_TOKEN,
        },
      });

      return transporter;
    } catch (error) {
      console.error('Error creating transporter:', error);
      throw new Error('Failed to create transporter');
    }
  };
  private async sendVerificationEmail(
    email: string,
    token: string,
  ): Promise<void> {
    try {
      const transporter = await this.createTransporter();

      const verificationUrl = `${process.env.DOMAIN}/verify-email?token=${token}`;

      const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Email Verification',
        html: `
        <div style="background-color: #f8f8f8; padding: 20px; border-radius: 10px;">
        <h2 style="color: #333;">Welcome to PDF-Management System,</h2>
        <p style="color: #555;">We are thrilled to have you on board. Our system is designed to help you manage your documents efficiently and securely.</p>
          <p style="color: #555;">To complete your registration, please verify your email address by clicking the button below:</p>
          <div style="margin-top: 20px;">
        <div style="text-align: center; margin-top: 20px;">
          <a href="${verificationUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Accept Invitation</a>
        </div>
        <p style="color: #777; margin-top: 20px;">If you did not create an account, please ignore this email.</p>
      </div>

      `,
      };

      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error in sendVerificationEmail:', error);
      throw new Error('Failed to send verification email');
    }
  }
  async createUser(signUpDto: SignUpDto): Promise<CreateUserResponseDto> {
    try {
      const validationErrors = await validate(signUpDto);
      if (validationErrors.length > 0) {
        const errorMessages = validationErrors
          .map((error) => Object.values(error.constraints))
          .flat()
          .join(', ');
        console.error('Validation errors:', errorMessages);
        throw new BadRequestException(errorMessages);
      }

      const { username, email, password, firstName, lastName, profilePic } =
        signUpDto;
      const existingUser = await this.userModel
        .findOne({
          $or: [{ username }, { email }],
        })
        .lean();

      if (existingUser) {
        if (existingUser.username === username) {
          throw new BadRequestException('Username already exists');
        }
        if (existingUser.email === email) {
          throw new BadRequestException('Email already exists');
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const emailVerificationToken = uuidv4();
      const emailVerificationExpires =
        Math.floor(Date.now() / 1000) + 24 * 60 * 60;

      // Send verification email before creating the user
      await this.sendVerificationEmail(email, emailVerificationToken);

      const user = await this.userModel.create({
        username,
        email,
        firstName,
        lastName,
        password: hashedPassword,
        profilePic,
        emailVerificationToken,
        emailVerificationExpires,
      });

      const fullName = `${firstName} ${lastName}`;
      const { _id, ...userData } = user.toObject();
      const modifiedUser = {
        userId: _id.toString(),
        fullName,
        ...userData,
      };

      return new CreateUserResponseDto(
        true,
        'User created successfully. Please check your email for verification.',
        201,
        modifiedUser,
      );
    } catch (error) {
      throw error;
    }
  }
  async verifyEmail(token: string): Promise<void> {
    const currentUnixTime = Math.floor(Date.now() / 1000);
    const user = await this.userModel.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: currentUnixTime },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();
  }

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
    if (!user.isEmailVerified) {
      throw new BadRequestException('Your Email is not verified please verify');
    }

    const token = this.generateToken(user);
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

  /*
    Get All users Function 
    Only admin can get all users
    */
  async getAllUsers(): Promise<GetAllUsersResponseDto> {
    try {
      const users = await this.userModel.find().select('-password -__v').lean();

      const modifiedUsers = users.map((user) => {
        const { _id, firstName, lastName, email, profilePic } = user;
        const fullName = `${firstName} ${lastName}`;
        return { userId: _id.toString(), fullName, email, profilePic };
      });

      return new GetAllUsersResponseDto(
        true,
        'Fetched all users successfully',
        200,
        modifiedUsers,
      );
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }
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
