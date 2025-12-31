import { Injectable } from '@nestjs/common';
import { UserFindRepository } from '../../repos/users/user-find.repository';

@Injectable()
export class UserQueryService {
    constructor(private userFindRepo: UserFindRepository) { }

    async findOne(email: string) {
        return this.userFindRepo.findOneByEmail(email);
    }

    async findOneByIdentifier(identifier: string) {
        return this.userFindRepo.findOneByIdentifier(identifier);
    }

    async findById(id: string) {
        return this.userFindRepo.findOneById(id);
    }
}
