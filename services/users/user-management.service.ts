import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserCreateRepository } from '../../repos/users/user-create.repository';
import { UserUpdateRepository } from '../../repos/users/user-update.repository';
import { UserDeleteRepository } from '../../repos/users/user-delete.repository';
import { UserContactRepository } from '../../repos/users/user-contact.repository';
import { UserCredentialRepository } from '../../repos/users/user-credential.repository';
import { UserQueryService } from './user-query.service';
import { KafkaService } from '../../modules/kafka/kafka.service';
import * as argon2 from 'argon2';
import { CreateUserDto } from '../../common/dto/auth/create-user.dto';
import { UpdateUserDto } from '../../common/dto/auth/update-user.dto';

@Injectable()
export class UserManagementService {
    private readonly logger = new Logger(UserManagementService.name);

    constructor(
        private userCreateRepo: UserCreateRepository,
        private userUpdateRepo: UserUpdateRepository,
        private userDeleteRepo: UserDeleteRepository,
        private userContactRepo: UserContactRepository,
        private userCredentialRepo: UserCredentialRepository,
        private userQueryService: UserQueryService,
        private kafkaService: KafkaService
    ) { }

    async create(data: CreateUserDto) {
        // Check for existing user
        if (data.email) {
            const existing = await this.userQueryService.findByEmail(data.email);
            if (existing) {
                throw new ConflictException('User with this email already exists.');
            }
        }

        // Exclude acceptTerms from persistence
        const { countryCode, phone, phoneNumber: fullPhoneNumber, country, password, acceptTerms, ...rest } = data;

        let phoneNumber = fullPhoneNumber || phone;
        if (countryCode && phone && !phone.startsWith('+')) {
            phoneNumber = `${countryCode}${phone}`;
        }

        let passwordHash = undefined;
        if (password) {
            passwordHash = await argon2.hash(password);
        }

        const user = await this.userCreateRepo.create({
            ...rest,
            email: rest.email || '',
            phoneNumber: phoneNumber || undefined,
            country: country || undefined,
            passwordHash,
        });

        // Emit 'USER_CREATED' event for other microservices (Wallet, Orgs, etc.)
        try {
            await this.kafkaService.emit('user.lifecycle', {
                type: 'USER_CREATED',
                userId: user.id,
                email: user.email,
                firstName: user.firstName,
                otherNames: user.otherNames,
                country: user.country,
                role: user.role,
                occurredAt: new Date().toISOString()
            });
            this.logger.log(`Emitted USER_CREATED for user ${user.id}`);
        } catch (err) {
            this.logger.error(`Failed to emit USER_CREATED for ${user.id}`, err);
            // We don't throw here to avoid failing user creation if Kafka is blipping
        }

        return user;
    }

    async checkEmailExists(email: string): Promise<boolean> {
        const user = await this.userQueryService.findByEmail(email);
        return !!user;
    }

    async updateProfile(userId: string, data: UpdateUserDto) {
        return this.userUpdateRepo.update(userId, data);
    }

    async updateUserRole(userId: string, role: string) {
        return this.userUpdateRepo.update(userId, { role });
    }

    async deleteUser(userId: string) {
        return this.userDeleteRepo.deleteUser(userId);
    }

    // --- Profile & Contacts ---

    async updatePreferences(userId: string, prefs: Prisma.InputJsonValue) {
        return this.userUpdateRepo.update(userId, { preferences: prefs });
    }

    async addContact(userId: string, data: { type: 'EMAIL' | 'PHONE' | 'WHATSAPP'; value: string; isPrimary?: boolean }) {
        // Validation could be added here
        return this.userContactRepo.create({
            userId,
            label: 'Main', // Default label
            ...data
        });
    }

    async verifyContact(userId: string, contactId: string, type: 'email' | 'phone') {
        // Here we would check logic or otp? 
        // For now, simple verify enabled.
        // We also need to check if it belongs to user but repository handles basic ID checks usually, or we add check.
        return this.userContactRepo.verify(contactId);
    }

    async removeContact(userId: string, contactId: string) {
        // Should verify ownership
        return this.userContactRepo.delete(contactId);
    }

    async uploadAvatar(userId: string, fileUrl: string) {
        return this.userUpdateRepo.update(userId, { avatarUrl: fileUrl });
    }
    async removeCredential(userId: string, provider: 'google' | 'apple') {
        return this.userCredentialRepo.deleteByUserAndProvider(userId, provider);
    }

    async updateContact(userId: string, contactId: string, data: { label?: string; capabilities?: Prisma.InputJsonValue }) {
        return this.userContactRepo.update(contactId, data);
    }

    async findOneByIdentifier(identifier: string) {
        return this.userQueryService.findOneByIdentifier(identifier);
    }
}
