import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { UserRepository } from '../repository/user.repository';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async registerUser() {
    return this.userRepository.create();
  }

  async inquireUser(userId: User['userId']) {
    const userRaidHistory = await this.userRepository.findRaidHistoriesByUserId(
      userId,
    );
    const totalScore = userRaidHistory.reduce((accumulator, currentObject) => {
      return accumulator + currentObject.score;
    }, 0);

    return { totalScore, userRaidHistory };
  }
}
