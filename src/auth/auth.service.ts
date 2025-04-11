import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterDTO } from './dto/register.dto';

import * as bcrypt from 'bcrypt';
import { JwtPayloadDTO } from './dto/jwt-payload.dto';
import { UserService } from 'user/user.service';
import { User } from 'user/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  async signIn(email: string, password: string) {
    const user: User | null = await this.userService.findByEmail(email);
    if (user == null || !bcrypt.compareSync(password, user?.password_hash)) {
      throw new UnauthorizedException();
    }

    const payload: JwtPayloadDTO = { sub: user.id, email: user.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async register(registerDTO: RegisterDTO) {
    const existedUser: User | null =
      await this.userService.findByEmailOrUsername(
        registerDTO.email,
        registerDTO.username,
      );
    if (existedUser) {
      throw new HttpException(
        'Email or username already exists',
        HttpStatus.CONFLICT,
      );
    }
    const user: User = new User();
    user.email = registerDTO.email;
    user.username = registerDTO.username;
    user.password_hash = bcrypt.hashSync(registerDTO.password, 10);
    await this.userService.save(user);
  }
}
