import React, { useEffect, useState } from 'react';
import {
  Button,
  Divider,
  Grid,
  Loader,
  NumberInput,
  Select,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { apiClient } from 'utils/reactQuery';
import useGetLogInPersonDetail from 'hooks/useGetLogInPersonDetail';

const COUNTRY_OPTIONS = [
  { value: 'MY', label: 'Malaysia' },
  { value: 'SG', label: 'Singapore' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'US', label: 'United States' },
  { value: 'AU', label: 'Australia' },
  { value: 'HK', label: 'Hong Kong' },
  { value: 'AE', label: 'United Arab Emirates' },
];

const ORG_TYPE_OPTIONS = [
  { value: 'PRIVATE_LIMITED', label: 'Private Limited (Sdn Bhd)' },
  { value: 'PUBLIC_LIMITED', label: 'Public Limited (Bhd)' },
  { value: 'PARTNERSHIP', label: 'Partnership' },
  { value: 'SOLE_PROPRIETORSHIP', label: 'Sole Proprietorship' },
  { value: 'GOVERNMENT_EP', label: 'Government — Exempt Purchase' },
  { value: 'GOVERNMENT_NON_EP', label: 'Government — Non Exempt Purchase' },
  { value: 'GOVERNMENT_LINKED_COMPANY', label: 'Government Linked Company' },
  { value: 'MULTINATIONAL_CORPORATION', label: 'Multinational Corporation' },
  { value: 'COOPERATIVE', label: 'Cooperative' },
  { value: 'OTHERS', label: 'Others' },
];

const COMPANY_SIZE_OPTIONS = [
  { value: '1-10', label: '1 – 10 employees' },
  { value: '11-50', label: '11 – 50 employees' },
  { value: '51-100', label: '51 – 100 employees' },
  { value: '101-250', label: '101 – 250 employees' },
  { value: '251-500', label: '251 – 500 employees' },
  { value: '501-1000', label: '501 – 1,000 employees' },
  { value: '1001+', label: '1,001+ employees' },
];

const CURRENCY_OPTIONS = [
  { value: 'MYR', label: 'MYR — Malaysian Ringgit' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'SGD', label: 'SGD — Singapore Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'AUD', label: 'AUD — Australian Dollar' },
  { value: 'AED', label: 'AED — UAE Dirham' },
];

const MyOrganisation: React.FC = () => {
  const { data: me } = useGetLogInPersonDetail();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const form = useForm({
    initialValues: {
      organizationName: '',
      country: '',
      businessRegistrationNumber: '',
      organizationType: '',
      taxIdentificationNumber: '',
      emailAddress: '',
      contactNumber: '',
      organizationWebsite: '',
      companySize: '',
      revenueCurrency: '',
      revenueAmount: undefined as number | undefined,
      registeredAddress: '',
      postcode: '',
      alias: '',
      yearEstablished: '',
    },
  });

  useEffect(() => {
    if (!me?.organizationId) return;
    setLoading(true);
    apiClient
      .get(`/trade-directory/api/organizations/${me.organizationId}`)
      .then((res) => {
        const org = res.data?.data ?? res.data;
        form.setValues({
          organizationName: org.organizationName ?? '',
          country: org.country ?? '',
          businessRegistrationNumber: org.businessRegistrationNumber ?? '',
          organizationType: org.organizationType ?? '',
          taxIdentificationNumber: org.taxIdentificationNumber ?? '',
          emailAddress: org.emailAddress ?? '',
          contactNumber: org.contactNumber ?? '',
          organizationWebsite: org.organizationWebsite ?? '',
          companySize: org.companySize ?? '',
          revenueCurrency: org.revenueCurrency ?? '',
          revenueAmount: org.revenueAmount ?? undefined,
          registeredAddress: org.registeredAddress ?? '',
          postcode: org.postcode ?? '',
          alias: org.alias ?? '',
          yearEstablished: org.yearEstablished ?? '',
        });
      })
      .catch(() => {
        notifications.show({
          title: 'Error',
          message: 'Failed to load organisation details.',
          color: 'red',
          autoClose: 3000,
        });
      })
      .finally(() => setLoading(false));
  }, [me?.organizationId]);

  const handleSave = async () => {
    if (!me?.organizationId) return;
    setSaving(true);
    try {
      await apiClient.patch(
        `/trade-directory/api/organizations/${me.organizationId}`,
        form.values,
      );
      notifications.show({
        title: 'Saved',
        message: 'Organisation details updated successfully.',
        color: 'green',
        autoClose: 3000,
      });
      setEditMode(false);
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to save changes.',
        color: 'red',
        autoClose: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Loader color="primary" />
      </div>
    );
  }

  const disabled = !editMode;

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
            My Organisation
          </Title>
          <Text size="sm" c="dimmed" mt={2}>
            Company profile for {me?.organizationName}
          </Text>
        </div>
        {!editMode ? (
          <Button
            onClick={() => setEditMode(true)}
            color="primary"
          >
            Edit
          </Button>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              variant="default"
              onClick={() => setEditMode(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              loading={saving}
              style={{ backgroundColor: '#1a1a2e' }}
            >
              Save Changes
            </Button>
          </div>
        )}
      </div>

      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: '28px 32px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        }}
      >
        <Divider label="Basic Information" labelPosition="left" mb={16} />
        <Grid gutter="md">
          <Grid.Col span={8}>
            <TextInput
              label="Organisation Name"
              disabled={disabled}
              {...form.getInputProps('organizationName')}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <Select
              label="Country"
              data={COUNTRY_OPTIONS}
              searchable
              disabled={disabled}
              {...form.getInputProps('country')}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <TextInput
              label="Alias / Trading Name"
              disabled={disabled}
              {...form.getInputProps('alias')}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <TextInput
              label="Year Established"
              disabled={disabled}
              {...form.getInputProps('yearEstablished')}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <Select
              label="Organisation Type"
              data={ORG_TYPE_OPTIONS}
              searchable
              disabled={disabled}
              {...form.getInputProps('organizationType')}
            />
          </Grid.Col>
        </Grid>

        <Divider label="Registration" labelPosition="left" mt={20} mb={16} />
        <Grid gutter="md">
          <Grid.Col span={6}>
            <TextInput
              label="Business Registration No."
              disabled={disabled}
              {...form.getInputProps('businessRegistrationNumber')}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label="Tax Identification No. (TIN)"
              disabled={disabled}
              {...form.getInputProps('taxIdentificationNumber')}
            />
          </Grid.Col>
        </Grid>

        <Divider label="Contact" labelPosition="left" mt={20} mb={16} />
        <Grid gutter="md">
          <Grid.Col span={4}>
            <TextInput
              label="Email Address"
              disabled={disabled}
              {...form.getInputProps('emailAddress')}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <TextInput
              label="Contact Number"
              disabled={disabled}
              {...form.getInputProps('contactNumber')}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <TextInput
              label="Website"
              disabled={disabled}
              {...form.getInputProps('organizationWebsite')}
            />
          </Grid.Col>
        </Grid>

        <Divider label="Size & Revenue" labelPosition="left" mt={20} mb={16} />
        <Grid gutter="md">
          <Grid.Col span={4}>
            <Select
              label="Company Size"
              data={COMPANY_SIZE_OPTIONS}
              disabled={disabled}
              {...form.getInputProps('companySize')}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <Select
              label="Revenue Currency"
              data={CURRENCY_OPTIONS}
              searchable
              disabled={disabled}
              {...form.getInputProps('revenueCurrency')}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <NumberInput
              label="Annual Revenue"
              thousandSeparator=","
              min={0}
              disabled={disabled}
              {...form.getInputProps('revenueAmount')}
            />
          </Grid.Col>
        </Grid>

        <Divider label="Address" labelPosition="left" mt={20} mb={16} />
        <Grid gutter="md">
          <Grid.Col span={8}>
            <TextInput
              label="Registered Address"
              disabled={disabled}
              {...form.getInputProps('registeredAddress')}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <TextInput
              label="Postcode"
              disabled={disabled}
              {...form.getInputProps('postcode')}
            />
          </Grid.Col>
        </Grid>
      </div>
    </div>
  );
};

export default MyOrganisation;
