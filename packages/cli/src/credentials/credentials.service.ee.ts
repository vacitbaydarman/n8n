import type { DeleteResult, EntityManager, FindOptionsWhere } from 'typeorm';
import { In, Not } from 'typeorm';
import { CredentialsEntity } from '@db/entities/CredentialsEntity';
import { SharedCredentials } from '@db/entities/SharedCredentials';
import type { User } from '@db/entities/User';
import { UserService } from '@/services/user.service';
import { CredentialsService, type CredentialsGetSharedOptions } from './credentials.service';
import { RoleService } from '@/services/role.service';
import Container from 'typedi';
import { SharedCredentialsRepository } from '@db/repositories/sharedCredentials.repository';

export class EECredentialsService extends CredentialsService {
	static async isOwned(
		user: User,
		credentialId: string,
	): Promise<{ ownsCredential: boolean; credential?: CredentialsEntity }> {
		const sharing = await this.getSharing(user, credentialId, { allowGlobalScope: false }, [
			'credentials',
			'role',
		]);

		if (!sharing || sharing.role.name !== 'owner') return { ownsCredential: false };

		const { credentials: credential } = sharing;

		return { ownsCredential: true, credential };
	}

	/**
	 * Retrieve the sharing that matches a user and a credential.
	 */
	static async getSharing(
		user: User,
		credentialId: string,
		options: CredentialsGetSharedOptions,
		relations: string[] = ['credentials'],
	): Promise<SharedCredentials | null> {
		const where: FindOptionsWhere<SharedCredentials> = { credentialsId: credentialId };

		// Omit user from where if the requesting user has relevant
		// global credential permissions. This allows the user to
		// access credentials they don't own.
		if (!options.allowGlobalScope || !user.hasGlobalScope(options.globalScope)) {
			where.userId = user.id;
		}

		return Container.get(SharedCredentialsRepository).findOne({
			where,
			relations,
		});
	}

	static async getSharings(
		transaction: EntityManager,
		credentialId: string,
		relations = ['shared'],
	): Promise<SharedCredentials[]> {
		const credential = await transaction.findOne(CredentialsEntity, {
			where: { id: credentialId },
			relations,
		});
		return credential?.shared ?? [];
	}

	static async pruneSharings(
		transaction: EntityManager,
		credentialId: string,
		userIds: string[],
	): Promise<DeleteResult> {
		const conditions: FindOptionsWhere<SharedCredentials> = {
			credentialsId: credentialId,
			userId: Not(In(userIds)),
		};
		return transaction.delete(SharedCredentials, conditions);
	}

	static async share(
		transaction: EntityManager,
		credential: CredentialsEntity,
		shareWithIds: string[],
	): Promise<SharedCredentials[]> {
		const users = await Container.get(UserService).getByIds(transaction, shareWithIds);
		const role = await Container.get(RoleService).findCredentialUserRole();

		const newSharedCredentials = users
			.filter((user) => !user.isPending)
			.map((user) =>
				Container.get(SharedCredentialsRepository).create({
					credentialsId: credential.id,
					userId: user.id,
					roleId: role?.id,
				}),
			);

		return transaction.save(newSharedCredentials);
	}
}
