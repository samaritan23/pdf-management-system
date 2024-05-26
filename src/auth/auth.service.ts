import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  async verifyToken(token: string): Promise<{ userId: string }> {
    return new Promise((resolve, reject) => {
      jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
          // Token verification failed
          reject(new UnauthorizedException(`Invalid token: ${err.message}`));
        } else {
          // Token is valid, resolve with decoded token
          resolve(decodedToken as { userId: string });
        }
      });
    });
  }
}
