import React from 'react';
import { Card, Group, Text, Title, SimpleGrid, ThemeIcon } from '@mantine/core';
import { IconBuilding, IconUserPlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { SUPER_ADMIN } from 'constants/routes';
import useGetLogInPersonDetail from 'hooks/useGetLogInPersonDetail';

const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: me } = useGetLogInPersonDetail();

  const cards = [
    {
      title: 'My Organisation',
      description: 'View and edit your organisation profile, company details, and contact information.',
      icon: <IconBuilding size={28} />,
      link: SUPER_ADMIN.ORGANIZATION,
      color: '#0369A1',
    },
    {
      title: 'Users',
      description: 'Add new users and assign roles such as CRM, Risk Analyst, Finance, and more.',
      icon: <IconUserPlus size={28} />,
      link: SUPER_ADMIN.USERS,
      color: '#1a1a2e',
    },
  ];

  return (
    <div style={{ padding: '40px 32px' }}>
      <div style={{ marginBottom: 32 }}>
        <Title order={2} style={{ color: '#1a1a2e' }}>
          {me?.organizationName ?? 'Dashboard'}
        </Title>
        <Text c="dimmed" size="sm" mt={4}>
          Welcome back, {me?.name ?? ''}. Manage your organisation from here.
        </Text>
      </div>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
        {cards.map((card) => (
          <Card
            key={card.title}
            shadow="sm"
            padding="xl"
            radius="md"
            withBorder
            style={{ cursor: 'pointer', transition: 'box-shadow 0.15s' }}
            onClick={() => navigate(card.link)}
            onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.boxShadow = '')
            }
          >
            <Group mb="md">
              <ThemeIcon
                size={52}
                radius="md"
                style={{ backgroundColor: card.color }}
              >
                {card.icon}
              </ThemeIcon>
            </Group>
            <Title order={4} mb={6}>
              {card.title}
            </Title>
            <Text size="sm" c="dimmed">
              {card.description}
            </Text>
          </Card>
        ))}
      </SimpleGrid>
    </div>
  );
};

export default SuperAdminDashboard;
