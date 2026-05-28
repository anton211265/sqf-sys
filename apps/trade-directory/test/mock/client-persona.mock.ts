import { ClientPersona } from 'apps/trade-directory/src/models';

const mockClientPersona = (): ClientPersona => {
  const clientPersona = new ClientPersona();

  return clientPersona;
};

export { mockClientPersona };
