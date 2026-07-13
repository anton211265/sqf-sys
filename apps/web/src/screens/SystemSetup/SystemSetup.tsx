import React, { useState } from 'react';
import {
  Button,
  Divider,
  Grid,
  Group,
  Loader,
  NumberInput,
  PasswordInput,
  Select,
  Stepper,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconBuilding, IconCheck, IconUser } from '@tabler/icons-react';
import axios from 'axios';
import { getAccessToken } from 'api/axiosClient';
import { BASE_URL } from 'constants/constant';

// ── Enum option lists ────────────────────────────────────────────────────────

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

const BUSINESS_SECTOR_OPTIONS = [
  { value: 'BANKING_AND_FINANCIAL_SERVICES', label: 'Banking & Financial Services' },
  { value: 'INFORMATION_TECHNOLOGY', label: 'Information Technology' },
  { value: 'MANUFACTURING', label: 'Manufacturing' },
  { value: 'CONSTRUCTION_AND_REAL_ESTATE', label: 'Construction & Real Estate' },
  { value: 'HEALTHCARE_AND_PHARMACEUTICALS', label: 'Healthcare & Pharmaceuticals' },
  { value: 'LOGISTICS_AND_TRANSPORTATION', label: 'Logistics & Transportation' },
  { value: 'RETAIL_AND_WHOLESALE', label: 'Retail & Wholesale' },
  { value: 'ENERGY', label: 'Energy' },
  { value: 'TELECOMMUNICATIONS', label: 'Telecommunications' },
  { value: 'FOOD_AND_BEVERAGE', label: 'Food & Beverage' },
  { value: 'EDUCATION_AND_TRAINING', label: 'Education & Training' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'LEGAL_SERVICES', label: 'Legal Services' },
  { value: 'AUTOMOTIVE', label: 'Automotive' },
  { value: 'OTHERS', label: 'Others' },
];

const NATURE_OF_BUSINESS_OPTIONS = [
  { value: 'AGRICULTURE', label: 'Agriculture' },
  { value: 'AUTOMOBILE', label: 'Automobile' },
  { value: 'AVIATION', label: 'Aviation' },
  { value: 'BUSINESS_SERVICES', label: 'Business Services' },
  { value: 'COMMUNICATION_AND_DIGITAL', label: 'Communication & Digital' },
  { value: 'CONSTRUCTION', label: 'Construction' },
  { value: 'DEFENCE', label: 'Defence' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'ENERGY', label: 'Energy' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'HEALTHCARE', label: 'Healthcare' },
  { value: 'HOSPITALITY_AND_TOURISM', label: 'Hospitality & Tourism' },
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

const MALAYSIA_REGION_OPTIONS = [
  { value: 'WEST_MALAYSIA', label: 'West Malaysia (Peninsular)' },
  { value: 'EAST_MALAYSIA', label: 'East Malaysia (Sabah & Sarawak)' },
  { value: 'OTHER', label: 'Other' },
];

// ── Component ────────────────────────────────────────────────────────────────

const SystemSetup: React.FC = () => {
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const orgForm = useForm({
    initialValues: {
      organizationName: '',
      country: '',
      businessRegistrationNumber: '',
      organizationType: '',
      taxIdentificationNumber: '',
      organizationBusinessSector: '',
      natureOfBusiness: '',
      registeredAddress: '',
      postcode: '',
      yearEstablished: '',
      revenueCurrency: '',
      revenueAmount: undefined as number | undefined,
      emailAddress: '',
      contactNumber: '',
      companySize: '',
      organizationWebsite: '',
      sstRegistrationNumber: '',
      alias: '',
      coreBusiness: '',
      malaysiaRegion: '',
      businessAddress: '',
    },
    validate: (values) => {
      if (active === 0) {
        return {
          organizationName: values.organizationName.trim() ? null : 'Organisation name is required',
          country: values.country ? null : 'Country is required',
        };
      }
      return {};
    },
  });

  const adminForm = useForm({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      designation: '',
    },
    validate: (values) => {
      if (active === 1) {
        return {
          name: values.name.trim() ? null : 'Full name is required',
          email: /^\S+@\S+\.\S+$/.test(values.email) ? null : 'Valid email is required',
          password: values.password.length >= 8 ? null : 'Password must be at least 8 characters',
          confirmPassword: values.password === values.confirmPassword ? null : 'Passwords do not match',
        };
      }
      return {};
    },
  });

  const handleNext = () => {
    if (active === 0 && orgForm.validate().hasErrors) return;
    if (active === 1 && adminForm.validate().hasErrors) return;
    setActive((s) => s + 1);
  };

  const handleBack = () => setActive((s) => Math.max(0, s - 1));

  const handleSubmit = async () => {
    if (adminForm.validate().hasErrors) return;
    setLoading(true);

    const { confirmPassword, ...adminValues } = adminForm.values;

    const payload = {
      organization: {
        ...orgForm.values,
        revenueAmount: orgForm.values.revenueAmount ?? undefined,
        // strip empty strings → undefined so backend ignores them
        ...Object.fromEntries(
          Object.entries(orgForm.values).map(([k, v]) => [k, v === '' ? undefined : v])
        ),
      },
      superAdmin: {
        ...adminValues,
        designation: adminValues.designation || 'Super Admin',
      },
    };

    try {
      const accessToken = getAccessToken();
      await axios.post(
        `${BASE_URL}/trade-directory/system-setup/initialize`,
        payload,
        { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } },
      );
      setDone(true);
      setActive(2);
      notifications.show({
        title: 'System initialized',
        message: 'Funder Organization and Super Admin account created successfully.',
        color: 'green',
        autoClose: 6000,
      });
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ?? 'An error occurred during initialization.';
      notifications.show({
        title: 'Initialization failed',
        message: Array.isArray(msg) ? msg.join(' · ') : msg,
        color: 'red',
        autoClose: 8000,
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Layout ─────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8f9fa',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '40px 16px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 820 }}>
        {/* Header */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <Title order={2} style={{ color: '#1a1a2e' }}>
            SQF.AI — System Initialization
          </Title>
          <Text c="dimmed" size="sm" mt={4}>
            Set up the Funder Organization and create the first Super Admin account.
            This screen is only accessible to the SQF System role.
          </Text>
        </div>

        {/* Stepper */}
        <Stepper
          active={active}
          color="primary"
          mb={32}
          styles={{ stepLabel: { fontSize: 13 } }}
        >
          <Stepper.Step
            icon={<IconBuilding size={18} />}
            label="Funder Organization"
            description="Company details"
          />
          <Stepper.Step
            icon={<IconUser size={18} />}
            label="Super Admin"
            description="First admin account"
          />
          <Stepper.Step
            icon={<IconCheck size={18} />}
            label="Complete"
            description="System ready"
          />
        </Stepper>

        {/* Card */}
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            padding: '32px 36px',
            boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
          }}
        >
          {/* ── STEP 0: Funder Organization ── */}
          {active === 0 && (
            <>
              <Title order={4} mb={4}>Funder Organization Details</Title>
              <Text size="xs" c="dimmed" mb={20}>
                Fields marked <span style={{ color: 'red' }}>*</span> are required.
              </Text>

              <Divider label="Mandatory" labelPosition="left" mb={16} />
              <Grid gutter="md">
                <Grid.Col span={8}>
                  <TextInput
                    label="Organisation Name"
                    placeholder="e.g. SQF Capital Sdn Bhd"
                    required
                    {...orgForm.getInputProps('organizationName')}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <Select
                    label="Country"
                    placeholder="Select country"
                    data={COUNTRY_OPTIONS}
                    searchable
                    required
                    {...orgForm.getInputProps('country')}
                  />
                </Grid.Col>
              </Grid>

              <Divider label="Company Registration" labelPosition="left" mt={20} mb={16} />
              <Grid gutter="md">
                <Grid.Col span={4}>
                  <TextInput
                    label="Business Registration No."
                    placeholder="e.g. 202301012345"
                    {...orgForm.getInputProps('businessRegistrationNumber')}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <Select
                    label="Organisation Type"
                    placeholder="Select type"
                    data={ORG_TYPE_OPTIONS}
                    searchable
                    {...orgForm.getInputProps('organizationType')}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <TextInput
                    label="Tax Identification No. (TIN)"
                    placeholder="e.g. C12345678900"
                    {...orgForm.getInputProps('taxIdentificationNumber')}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <TextInput
                    label="SST Registration No."
                    placeholder="e.g. W10-1234-12345678"
                    {...orgForm.getInputProps('sstRegistrationNumber')}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <TextInput
                    label="Alias / Trading Name"
                    placeholder="e.g. SQF Capital"
                    {...orgForm.getInputProps('alias')}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <TextInput
                    label="Year Established"
                    placeholder="e.g. 2018"
                    maxLength={4}
                    {...orgForm.getInputProps('yearEstablished')}
                  />
                </Grid.Col>
              </Grid>

              <Divider label="Industry" labelPosition="left" mt={20} mb={16} />
              <Grid gutter="md">
                <Grid.Col span={6}>
                  <Select
                    label="Business Sector"
                    placeholder="Select sector"
                    data={BUSINESS_SECTOR_OPTIONS}
                    searchable
                    {...orgForm.getInputProps('organizationBusinessSector')}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <Select
                    label="Nature of Business"
                    placeholder="Select nature"
                    data={NATURE_OF_BUSINESS_OPTIONS}
                    searchable
                    {...orgForm.getInputProps('natureOfBusiness')}
                  />
                </Grid.Col>
                <Grid.Col span={12}>
                  <TextInput
                    label="Core Business Description"
                    placeholder="Brief description of main business activity"
                    {...orgForm.getInputProps('coreBusiness')}
                  />
                </Grid.Col>
              </Grid>

              <Divider label="Contact & Size" labelPosition="left" mt={20} mb={16} />
              <Grid gutter="md">
                <Grid.Col span={4}>
                  <TextInput
                    label="Email Address"
                    placeholder="info@yourcompany.com"
                    {...orgForm.getInputProps('emailAddress')}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <TextInput
                    label="Contact Number"
                    placeholder="+60312345678"
                    {...orgForm.getInputProps('contactNumber')}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <TextInput
                    label="Website"
                    placeholder="https://yourcompany.com"
                    {...orgForm.getInputProps('organizationWebsite')}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <Select
                    label="Company Size"
                    placeholder="No. of employees"
                    data={COMPANY_SIZE_OPTIONS}
                    {...orgForm.getInputProps('companySize')}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <Select
                    label="Revenue Currency"
                    placeholder="Select currency"
                    data={CURRENCY_OPTIONS}
                    searchable
                    {...orgForm.getInputProps('revenueCurrency')}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <NumberInput
                    label="Annual Revenue"
                    placeholder="e.g. 5000000"
                    thousandSeparator=","
                    min={0}
                    {...orgForm.getInputProps('revenueAmount')}
                  />
                </Grid.Col>
              </Grid>

              <Divider label="Address" labelPosition="left" mt={20} mb={16} />
              <Grid gutter="md">
                <Grid.Col span={8}>
                  <TextInput
                    label="Registered Address"
                    placeholder="Full registered address"
                    {...orgForm.getInputProps('registeredAddress')}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <TextInput
                    label="Postcode"
                    placeholder="e.g. 50450"
                    {...orgForm.getInputProps('postcode')}
                  />
                </Grid.Col>
                <Grid.Col span={8}>
                  <TextInput
                    label="Business / Operating Address"
                    placeholder="If different from registered address"
                    {...orgForm.getInputProps('businessAddress')}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <Select
                    label="Malaysia Region"
                    placeholder="Select region"
                    data={MALAYSIA_REGION_OPTIONS}
                    {...orgForm.getInputProps('malaysiaRegion')}
                  />
                </Grid.Col>
              </Grid>
            </>
          )}

          {/* ── STEP 1: Super Admin ── */}
          {active === 1 && (
            <>
              <Title order={4} mb={4}>Super Admin Account</Title>
              <Text size="xs" c="dimmed" mb={20}>
                This account will have full administrative access to the platform.
              </Text>

              <Grid gutter="md">
                <Grid.Col span={6}>
                  <TextInput
                    label="Full Name"
                    placeholder="e.g. Jane Smith"
                    required
                    {...adminForm.getInputProps('name')}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="Designation / Job Title"
                    placeholder="e.g. Chief Operating Officer"
                    {...adminForm.getInputProps('designation')}
                  />
                </Grid.Col>
                <Grid.Col span={12}>
                  <TextInput
                    label="Email Address"
                    placeholder="admin@yourcompany.com"
                    required
                    {...adminForm.getInputProps('email')}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <PasswordInput
                    label="Password"
                    placeholder="Minimum 8 characters"
                    required
                    {...adminForm.getInputProps('password')}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <PasswordInput
                    label="Confirm Password"
                    placeholder="Re-enter password"
                    required
                    {...adminForm.getInputProps('confirmPassword')}
                  />
                </Grid.Col>
              </Grid>

              <div
                style={{
                  marginTop: 20,
                  padding: '12px 16px',
                  background: '#fff8e1',
                  borderRadius: 8,
                  border: '1px solid #ffe082',
                }}
              >
                <Text size="xs" c="dimmed">
                  <strong>Note:</strong> This account will be assigned the{' '}
                  <strong>Super User</strong> role and linked to the Funder Organization
                  created in Step 1. The login email and password set here are used
                  to sign in via the standard login screen at{' '}
                  <code>/auth/login</code>.
                </Text>
              </div>
            </>
          )}

          {/* ── STEP 2: Complete ── */}
          {active === 2 && done && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: '#e6f4ea',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                }}
              >
                <IconCheck size={32} color="#2e7d32" />
              </div>
              <Title order={3} mb={8} style={{ color: '#1a1a2e' }}>
                System Initialized Successfully
              </Title>
              <Text size="sm" c="dimmed" mb={24}>
                The Funder Organization and Super Admin account have been created.
                You can now log in with the Super Admin credentials at{' '}
                <strong>/auth/login</strong>.
              </Text>
              <Button
                component="a"
                href="/auth/login"
                color="primary"
              >
                Go to Login
              </Button>
            </div>
          )}

          {/* ── Navigation buttons ── */}
          {active < 2 && (
            <Group justify="space-between" mt={28}>
              <Button
                variant="default"
                onClick={handleBack}
                disabled={active === 0}
              >
                Back
              </Button>

              {active === 0 && (
                <Button
                  onClick={handleNext}
                  color="primary"
                >
                  Next — Super Admin Setup
                </Button>
              )}

              {active === 1 && (
                <Button
                  onClick={handleSubmit}
                  loading={loading}
                  leftSection={loading ? <Loader size={14} color="white" /> : null}
                  style={{ backgroundColor: '#1a1a2e' }}
                >
                  Initialize System
                </Button>
              )}
            </Group>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemSetup;
