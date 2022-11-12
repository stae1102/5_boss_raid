import { Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { User } from '@prisma/client';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async registerUser() {
    return this.userService.registerUser();
  }

  @Get(':userId')
  async inquireUser(@Param('userId', ParseIntPipe) userId: User['userId']) {
    return this.userService.inquireUser(userId);
  }
}
