import { Badge, Group } from '@mantine/core';
import {
  ContractStatusEnum,
  InvoiceStatusEnum,
  LendingProductEnum,
  LendingProductLabel,
  RelationshipStatusEnum,
} from 'constants/enum';
import React from 'react';

export const PersonaBadges: React.FC<{
  personas: {
    isClient: boolean;
    isSupplier: boolean;
    isBuyer: boolean;
    isFunder: boolean;
  };
}> = ({ personas }) => (
  <Group gap={4}>
    {personas.isFunder && (
      <Badge size="sm" color="navy" variant="filled">
        Funder
      </Badge>
    )}
    {personas.isClient && (
      <Badge size="sm" color="primary" variant="light">
        Client
      </Badge>
    )}
    {personas.isSupplier && (
      <Badge size="sm" color="teal" variant="light">
        Supplier
      </Badge>
    )}
    {personas.isBuyer && (
      <Badge size="sm" color="grape" variant="light">
        Buyer
      </Badge>
    )}
    {!personas.isFunder &&
      !personas.isClient &&
      !personas.isSupplier &&
      !personas.isBuyer && (
        <Badge size="sm" color="gray" variant="light">
          No persona
        </Badge>
      )}
  </Group>
);

const invoiceStatusColor: Record<InvoiceStatusEnum, string> = {
  [InvoiceStatusEnum.UPLOADED]: 'gray',
  [InvoiceStatusEnum.VALIDATED]: 'blue',
  [InvoiceStatusEnum.APPROVED_FOR_FINANCE]: 'indigo',
  [InvoiceStatusEnum.PRESENTED]: 'violet',
  [InvoiceStatusEnum.FINANCED]: 'primary',
  [InvoiceStatusEnum.PARTIALLY_PAID]: 'yellow',
  [InvoiceStatusEnum.PAID]: 'green',
  [InvoiceStatusEnum.OVERDUE]: 'red',
  [InvoiceStatusEnum.CLOSED]: 'dark',
  [InvoiceStatusEnum.REJECTED]: 'red',
};

export const InvoiceStatusBadge: React.FC<{ status: InvoiceStatusEnum }> = ({
  status,
}) => (
  <Badge size="sm" color={invoiceStatusColor[status] ?? 'gray'} variant="light">
    {status.replace(/_/g, ' ')}
  </Badge>
);

const contractStatusColor: Record<ContractStatusEnum, string> = {
  [ContractStatusEnum.DRAFT]: 'gray',
  [ContractStatusEnum.ACTIVE]: 'green',
  [ContractStatusEnum.EXPIRED]: 'yellow',
  [ContractStatusEnum.TERMINATED]: 'red',
};

export const ContractStatusBadge: React.FC<{ status: ContractStatusEnum }> = ({
  status,
}) => (
  <Badge size="sm" color={contractStatusColor[status] ?? 'gray'} variant="light">
    {status}
  </Badge>
);

export const RelationshipStatusBadge: React.FC<{
  status: RelationshipStatusEnum;
}> = ({ status }) => (
  <Badge
    size="sm"
    color={status === RelationshipStatusEnum.ACTIVE ? 'green' : 'gray'}
    variant="light"
  >
    {status}
  </Badge>
);

export const LendingProductBadge: React.FC<{
  product?: LendingProductEnum | null;
}> = ({ product }) =>
  product ? (
    <Badge size="sm" color="navy" variant="light">
      {LendingProductLabel[product] ?? product}
    </Badge>
  ) : (
    <>—</>
  );
