import {
  AppShell,
  Burger,
  Group,
  NavLink,
  ScrollArea,
  Text,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconBuilding, IconUsers, IconPower } from '@tabler/icons-react';
import { AUTH, SUPER_ADMIN } from 'constants/routes';
import useLogout from 'hooks/useLogout';
import React, { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface Props {
  children: ReactNode;
  onButtonClick?: () => void;
  persona?: string;
}

const SuperAdminLayout: React.FC<Props> = ({ children }) => {
  const navigate = useNavigate();
  const [opened, { toggle }] = useDisclosure();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const location = useLocation();
  const logoutMutation = useLogout();

  const navItems = [
    {
      label: 'My Organisation',
      icon: <IconBuilding size="1rem" />,
      link: SUPER_ADMIN.ORGANIZATION,
    },
    {
      label: 'Users',
      icon: <IconUsers size="1rem" />,
      link: SUPER_ADMIN.USERS,
    },
  ];

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => navigate(AUTH.LOGIN),
      onError: (e) => {
        notifications.show({
          id: 'logout-error',
          title: 'Error',
          message: (e as Error).message,
          color: 'red',
          autoClose: 2000,
        });
      },
    });
  };

  return (
    <AppShell
      header={{ height: isMobile ? 60 : 0 }}
      navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: !opened } }}
    >
      <AppShell.Header>
        {isMobile && (
          <Group p="md">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          </Group>
        )}
      </AppShell.Header>

      <AppShell.Navbar>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
          <Text size="xl" fw={700} style={{ color: '#1a1a2e' }}>SQF.AI</Text>
          <Text size="xs" c="dimmed" mt={2}>Super Admin</Text>
        </div>

        <ScrollArea style={{ flex: 1 }} p="xs">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              label={item.label}
              leftSection={item.icon}
              onClick={() => navigate(item.link)}
              active={location.pathname === item.link}
              style={{ borderRadius: 6, marginBottom: 2 }}
            />
          ))}
        </ScrollArea>

        <div style={{ borderTop: '1px solid #f0f0f0', padding: '8px' }}>
          <NavLink
            label="Logout"
            leftSection={<IconPower size="1rem" />}
            onClick={handleLogout}
            style={{ borderRadius: 6 }}
          />
        </div>
      </AppShell.Navbar>

      <AppShell.Main>
        <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
          {children}
        </div>
      </AppShell.Main>
    </AppShell>
  );
};

export default SuperAdminLayout;
