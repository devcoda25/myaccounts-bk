import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UserDeleteRepository {
    constructor(private prisma: PrismaService) { }

    async deleteUser(userId: string): Promise<User> {
        // Transaction to ensure cleanup of related data if cascading isn't automatic or if explicit order needed
        // Prisma usually handles simple cascade if configured, but explicit is safer for key entities
        return this.prisma.$transaction(async (tx) => {
            // Delete sessions first
            await tx.session.deleteMany({ where: { userId } });

            // Delete credentials
            await tx.userCredential.deleteMany({ where: { userId } });



            // Finally delete user
            return tx.user.delete({
                where: { id: userId },
            });
        });
    }
}
