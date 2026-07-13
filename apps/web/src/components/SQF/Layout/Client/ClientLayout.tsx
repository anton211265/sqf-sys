import {
  AppShell,
  Box,
  Burger,
  Group,
  NavLink,
  ScrollArea,
  Text,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconDevicesCheck,
  IconFile,
  IconPower,
  IconSettings,
} from '@tabler/icons-react';
import { AUTH, CLIENT_DASHBOARD } from 'constants/routes';
import useLogout from 'hooks/useLogout';
import React, { FC, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './ClientLayout.module.css';
import useGetLogInPersonDetail from 'hooks/useGetLogInPersonDetail';

interface IProps {
  children: ReactNode;
  onButtonClick: () => void;
  persona?: string;
}

const ClientLayout: FC<IProps> = ({ children, onButtonClick, persona }) => {
  const { data, error, isLoading } = useGetLogInPersonDetail();
  const navigate = useNavigate();
  const logoutMuation = useLogout();
  const [opened, { toggle }] = useDisclosure();
  const isMobile = useMediaQuery('(max-width: 768px)'); // Detects mobile screens
  const location = useLocation();
  const path = location.pathname;

  if (error) {
    notifications.show({
      id: 'error',
      title: 'Error',
      message: (error as Error).message,
      color: 'red',
      autoClose: 2000,
    });
  }

  const navMenu = [
    {
      label: 'Consensus Messaging',
      icon: <IconDevicesCheck size="1rem" />,
      link: CLIENT_DASHBOARD.DOC_MGT_CONSENSUS_MESSAGING,
      active: CLIENT_DASHBOARD.DOC_MGT_CONSENSUS_MESSAGING === path,
    },
    {
      label: 'Document Extraction',
      icon: <IconFile size="1rem" />,
      children: [
        {
          label: 'Prompt Templates',
          link: CLIENT_DASHBOARD.DOC_MGT_TEMPLATES,
          active: CLIENT_DASHBOARD.DOC_MGT_TEMPLATES === path,
        },
        {
          label: 'Extractions',
          link: CLIENT_DASHBOARD.DOC_MGT_EXTRACTIONS,
          active: CLIENT_DASHBOARD.DOC_MGT_EXTRACTIONS === path,
        },
      ],
    },
    {
      label: 'Developer Tools',
      icon: <IconSettings size="1rem" />,
      children: [
        {
          label: 'Documentation',
          link: CLIENT_DASHBOARD.DOC_MGT_DOCUMENTATION,
          active: CLIENT_DASHBOARD.DOC_MGT_DOCUMENTATION === path,
        },
        {
          label: 'API Reference',
          link: CLIENT_DASHBOARD.DOC_MGT_REFERENCE,
          active: CLIENT_DASHBOARD.DOC_MGT_REFERENCE === path,
        },
        {
          label: 'API Keys',
          link: CLIENT_DASHBOARD.DOC_MGT_API_KEY,
          active: CLIENT_DASHBOARD.DOC_MGT_API_KEY === path,
        },
        {
          label: 'Webhooks',
          link: CLIENT_DASHBOARD.DOC_MGT_WEBHOOKS,
          active: CLIENT_DASHBOARD.DOC_MGT_WEBHOOKS === path,
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

        {!isLoading && (
          <Box px="xl" py="sm">
            <Text size="sm" w={500}>
              {data?.name}
            </Text>
            <Text size="sm" c="dimmed">
              {data?.organizationName}
            </Text>
          </Box>
        )}

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

export default ClientLayout;
