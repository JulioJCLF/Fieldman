import { describe, expect, it } from 'vitest';

import { parseCreatePlayer, parsePlayerSearchQuery } from './player.schemas.js';

const validPlayer = {
  name: '  Ana   Oliveira ',
  cpf: '529.982.247-25',
  phone: '(11) 99999-9999',
  email: ' ANA@EXAMPLE.COM ',
  date_of_birth: '1995-04-12',
  terms_accepted: true,
};

describe('player schemas', () => {
  it('normalizes player data before persistence', () => {
    expect(parseCreatePlayer(validPlayer)).toMatchObject({
      name: 'Ana Oliveira',
      cpf: '52998224725',
      phone: '5511999999999',
      email: 'ana@example.com',
      client_type: 'BOTH',
      terms_accepted: true,
    });
  });

  it('rejects an invalid CPF and missing term acceptance', () => {
    expect(() => parseCreatePlayer({ ...validPlayer, cpf: '111.111.111-11' })).toThrow('CPF');
    expect(() => parseCreatePlayer({ ...validPlayer, terms_accepted: false })).toThrow('aceite');
  });

  it('requires exactly one valid search criterion', () => {
    expect(parsePlayerSearchQuery({ registration_number: '12' })).toEqual({ field: 'registration_number', value: 12 });
    expect(parsePlayerSearchQuery({ cpf: '529.982.247-25' })).toEqual({ field: 'cpf', value: '52998224725' });
    expect(parsePlayerSearchQuery({ phone: '(11) 99999-9999' })).toEqual({ field: 'phone', value: '5511999999999' });
    expect(() => parsePlayerSearchQuery({ cpf: '52998224725', phone: '11999999999' })).toThrow('exatamente um');
  });
});
