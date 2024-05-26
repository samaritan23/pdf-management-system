// authorization.middleware.ts

import { Injectable, NestMiddleware } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthorizationMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const authorizationHeader = req.headers['authorization'];

    if (authorizationHeader) {
      const token = authorizationHeader.replace('Bearer ', '');

      try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET) as {
          userId: string;
          userType: string;
        };
        req.user = {
          userId: decodedToken.userId,
          userType: decodedToken.userType,
        };
        console.log('Decoded Token:', decodedToken);
      } catch (error) {
        // Handle token verification error if needed
        console.error('Token verification error:', error);
      }
    }

    next();
  }
}
