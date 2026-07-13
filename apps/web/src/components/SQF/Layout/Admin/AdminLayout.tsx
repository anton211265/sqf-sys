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
import {
  IconSettings,
  IconBuilding,
  IconPower,
  IconNetwork,
} from '@tabler/icons-react';
import { ADMIN, AUTH, TRADE_DIRECTORY } from 'constants/routes';
import useLogout from 'hooks/useLogout';
import React, { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './AdminLayout.module.css';

interface LayoutProps {
  children: ReactNode;
  onButtonClick: () => void;
  persona?: string;
}

const AdminLayout: React.FC<LayoutProps> = ({
  children,
  onButtonClick,
  persona,
}) => {
  const navigate = useNavigate();
  const [opened, { toggle }] = useDisclosure();
  const isMobile = useMediaQuery('(max-width: 768px)'); // Detects mobile screens
  const location = useLocation();
  const logoutMuation = useLogout();

  const navMenu = [
    {
      label: 'Organization',
      icon: <IconBuilding size="1rem" />,
      link: ADMIN.ORGANIZATIONS,
      active: ADMIN.ORGANIZATIONS === location.pathname,
    },
    {
      label: 'Trade Directory',
      icon: <IconNetwork size="1rem" />,
      children: [
        {
          label: 'Directory',
          link: TRADE_DIRECTORY.HOME,
          active: TRADE_DIRECTORY.HOME === location.pathname,
        },
        {
          label: 'Invoices',
          link: TRADE_DIRECTORY.INVOICES,
          active: TRADE_DIRECTORY.INVOICES === location.pathname,
        },
        {
          label: 'Contracts',
          link: TRADE_DIRECTORY.CONTRACTS,
          active: TRADE_DIRECTORY.CONTRACTS === location.pathname,
        },
        {
          label: 'Subscriptions',
          link: TRADE_DIRECTORY.SUBSCRIPTIONS,
          active: TRADE_DIRECTORY.SUBSCRIPTIONS === location.pathname,
        },
        {
          label: 'Opportunities',
          link: TRADE_DIRECTORY.OPPORTUNITIES,
          active: TRADE_DIRECTORY.OPPORTUNITIES === location.pathname,
        },
      ],
    },
    {
      label: 'Configuration',
      icon: <IconSettings size="1rem" />,
      children: [
        {
          label: 'Risk Models',
          link: ADMIN.RISKMODELS,
          active: ADMIN.RISKMODELS === location.pathname,
        },
        {
          label: 'Risk Profiles',
          link: ADMIN.THRESHOLDRISKPROFILES,
          active: ADMIN.THRESHOLDRISKPROFILES === location.pathname,
        },
      ],
    },
  ];

  const getNavMenu = () => {
    return navMenu.map((item) => {
      if (item.children) {
        return (
          <NavLink key={item.label} label={item.label} leftSection={item.icon}>
            {item.children.map((child) => (
              <NavLink
                key={child.label}
                label={child.label}
                pl="lg"
                onClick={() => navigate(child.link)}
                active={child.active}
              />
            ))}
          </NavLink>
        );
      } else {
        return (
          <NavLink
            key={item.label}
            label={item.label}
            leftSection={item.icon}
            onClick={() => navigate(item.link)}
            active={item.active}
          />
        );
      }
    });
  };

  const handleLogout = () => {
    logoutMuation.mutate(undefined, {
      onSuccess: () => {
        navigate(AUTH.LOGIN);
      },
      onError: (e) => {
        const message = (e as Error).message;

        notifications.show({
          id: 'error',
          title: 'Error',
          message,
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
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
          </Group>
        )}
      </AppShell.Header>
      <AppShell.Navbar>
        <div className="p-8">
          <Text size="xl" fw={700}>
            SQF.AI
          </Text>
        </div>
        <ScrollArea
          style={{ height: '100vh', minWidth: '240px' }}
          className="p-3"
        >
          {getNavMenu()}
        </ScrollArea>
        <div className={styles.logout}>
          <NavLink
            label="Logout"
            leftSection={<IconPower size="1rem" />}
            onClick={handleLogout}
            className="cursor-pointer"
          />
        </div>
      </AppShell.Navbar>

      <AppShell.Main>
        <div className="flex-1 overflow-auto bg-zinc-100">{children}</div>
      </AppShell.Main>
    </AppShell>
  );
};

export default AdminLayout;
