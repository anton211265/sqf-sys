import React, { useState } from 'react';
import {
  Button,
  Divider,
  Grid,
  Modal,
  PasswordInput,
  Select,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconUserPlus } from '@tabler/icons-react';
import { apiClient } from 'utils/reactQuery';

const ROLE_OPTIONS = [
  { value: 'CRM', label: 'CRM' },
  { value: 'RISK_ANALYST', label: 'Risk Analyst' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'SUPERVISOR_APPROVAL', label: 'Supervisor Approval' },
  { value: 'MANAGER_APPROVAL', label: 'Manager Approval' },
];

interface UserRow {
  id: number;
  name: string;
  email: string;
}

const Users: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<UserRow[]>([]);

  const form = useForm({
    initialValues: {
      name: '',
      designation: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: '',
    },
    validate: {
      name: (v) => (v.trim() ? null : 'Full name is required'),
      email: (v) =>
        /^\S+@\S+\.\S+$/.test(v) ? null : 'Valid email is required',
      password: (v) =>
        v.length >= 8 ? null : 'Password must be at least 8 characters',
      confirmPassword: (v, values) =>
        v === values.password ? null : 'Passwords do not match',
      role: (v) => (v ? null : 'Role is required'),
    },
  });

  const handleCreate = async () => {
    if (form.validate().hasErrors) return;
    setSaving(true);
    const { confirmPassword, ...payload } = form.values;
    try {
      const res = await apiClient.post('/trade-directory/api/person/users', payload);
      setUsers((prev) => [...prev, res.data]);
      notifications.show({
        title: 'User created',
        message: `${res.data.name} has been added successfully.`,
        color: 'green',
        autoClose: 4000,
      });
      form.reset();
      setModalOpen(false);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ?? 'Failed to create user.';
      notifications.show({
        title: 'Error',
        message: Array.isArray(msg) ? msg.join(' · ') : msg,
        color: 'red',
        autoClose: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '40px 32px', maxWidth: 900 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 28,
        }}
      >
        <div>
          <Title order={3} style={{ color: '#1a1a2e' }}>
            Users
          </Title>
          <Text size="sm" c="dimmed" mt={2}>
            Add new users and assign roles within your organisation.
          </Text>
        </div>
        <Button
          leftSection={<IconUserPlus size={16} />}
          onClick={() => setModalOpen(true)}
          color="primary"
        >
          Add User
        </Button>
      </div>

      {/* Users list */}
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
          overflow: 'hidden',
        }}
      >
        {users.length === 0 ? (
          <div style={{ padding: '48px 32px', textAlign: 'center' }}>
            <Text c="dimmed" size="sm">
              No users added yet. Click <strong>Add User</strong> to get started.
            </Text>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 13, fontWeight: 600 }}>Name</th>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 13, fontWeight: 600 }}>Email</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 20px', fontSize: 14 }}>{u.name}</td>
                  <td style={{ padding: '12px 20px', fontSize: 14, color: '#555' }}>{u.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create user modal */}
      <Modal
        opened={modalOpen}
        onClose={() => {
          form.reset();
          setModalOpen(false);
        }}
        title={
          <Title order={4} style={{ color: '#1a1a2e' }}>
            Add New User
          </Title>
        }
        size="lg"
        radius="md"
      >
        <Divider mb={16} />
        <Grid gutter="md">
          <Grid.Col span={6}>
            <TextInput
              label="Full Name"
              placeholder="e.g. Jane Smith"
              required
              {...form.getInputProps('name')}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label="Employee ID / Designation"
              placeholder="e.g. EMP-001 or Job Title"
              {...form.getInputProps('designation')}
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <TextInput
              label="Email"
              placeholder="jane@yourcompany.com"
              required
              {...form.getInputProps('email')}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <PasswordInput
              label="Password"
              placeholder="Minimum 8 characters"
              required
              {...form.getInputProps('password')}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <PasswordInput
              label="Confirm Password"
              placeholder="Re-enter password"
              required
              {...form.getInputProps('confirmPassword')}
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <Select
              label="Role"
              placeholder="Select a role"
              data={ROLE_OPTIONS}
              required
              {...form.getInputProps('role')}
            />
          </Grid.Col>
        </Grid>

        <div
          style={{
            marginTop: 16,
            padding: '10px 14px',
            background: '#fff8e1',
            borderRadius: 8,
            border: '1px solid #ffe082',
          }}
        >
          <Text size="xs" c="dimmed">
            The user will be linked to your organisation with the selected role.
            They can log in with the email and password set here.
          </Text>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <Button
            variant="default"
            onClick={() => {
              form.reset();
              setModalOpen(false);
            }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            loading={saving}
            style={{ backgroundColor: '#1a1a2e' }}
          >
            Create User
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Users;
