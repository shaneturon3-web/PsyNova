import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() payload: RegisterDto) {
    return this.authService.register(payload);
  }

  @Post('login')
  login(@Body() payload: LoginDto) {
    return this.authService.login(payload);
  }

  @Post('logout')
  logout(@Headers('authorization') authorizationHeader?: string) {
    return this.authService.logout(authorizationHeader);
  }

  @Post('refresh')
  refresh(@Headers('authorization') authorizationHeader?: string) {
    return this.authService.refresh(authorizationHeader);
  }

  @Get('me')
  me(@Headers('authorization') authorizationHeader?: string) {
    const payload = this.authService.verifyAccessToken(authorizationHeader);
    return {
      user: payload,
      tag: 'MOCKUP-PURPOSE-ONLY',
    };
  }
}
