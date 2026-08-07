import { describe, expect, it } from 'vitest';

import { playerRegistrationSchema } from './validation';

const validRegistration = {
  name: 'Ana Oliveira',
  cpf: '529.982.247-25',
  phone: '(11) 99999-8888',
  email: 'ANA@EXAMPLE.COM',
  date_of_birth: '1994-08-15',
  client_type: 'BOTH' as const,
  profile: '',
  terms_accepted: true,
};

describe('playerRegistrationSchema', () => {
  it('normalizes valid registration data before it is sent to the API', () => {
    const result = playerRegistrationSchema.safeParse(validRegistration);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cpf).toBe('52998224725');
      expect(result.data.phone).toBe('5511999998888');
      expect(result.data.email).toBe('ana@example.com');
    }
  });

  it('rejects an invalid CPF and a missing terms acceptance', () => {
    const result = playerRegistrationSchema.safeParse({
      ...validRegistration,
      cpf: '111.111.111-11',
      terms_accepted: false,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.cpf).toContain('Informe um CPF válido.');
      expect(errors.terms_accepted).toContain('É necessário registrar o aceite do termo.');
    }
  });
});
