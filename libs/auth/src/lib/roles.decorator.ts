import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/** Decora un handler o controller con i ruoli richiesti per l'accesso */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
