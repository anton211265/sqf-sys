import React, { useEffect, useState, ChangeEvent } from 'react';
import {
  Button,
  Select,
  NumberInput,
  Text,
  Tooltip,
  Textarea,
} from '@mantine/core';
import {
  IconBuilding,
  IconCalendar,
  IconInfoCircle,
} from '@tabler/icons-react';
import TextInput from 'components/TextBox/TextBox';
import { companyType } from 'constants/companyType';
import { countries, currencyList } from 'constants/countries';
import { businessSectors } from 'constants/businessSector';
import { numberOfEmployees } from 'constants/numberOfEmployees';
import { YearPickerInput } from '@mantine/dates';
import { useForm, zodResolver } from '@mantine/form';
import {
  businessProfileDetails,
  businessProfileFormInitialValues,
} from 'screens/SQF/Client/Onboarding/Forms/Components/InitialValues';
import { businessProfileValidator } from 'screens/SQF/Client/Onboarding/Forms/Components/FormValidation';
import { notifications } from '@mantine/notifications';
import { color } from 'constants/color';
import axios from 'axios';
import { BASE_URL } from 'constants/constant';
import useGetLogInPersonDetail from 'hooks/useGetLogInPersonDetail';
import { countriesData } from 'constants/countries';

interface Props {
  setNextActiveSteps: () => void;
}

const ClientOnboardingBusinessProfileForm: React.FC<Props> = ({
  setNextActiveSteps,
}) => {
  const [yearEstablished, setYearEstablished] = useState<Date | null>(null);

  // const [organizationId, setOrganizationId] = useState<number | null>(null);

  // useEffect(() => {
  // Flag to track if component is still mounted
  // React's Strict Mode in development renders components twice on purpose to detect unexpected side effects.
  // This can cause `useEffect` to run twice, leading to duplicate API calls and multiple notifications.
  // The `isMounted` flag helps control this behavior by only allowing code execution if the component is still mounted.
  // let isMounted = true;

  // const fetchKycData = async () => {
  //   try {
  //     // Get the latest application in database
  //     const getLatestApplication = await axios.get(
  //       `${BASE_URL}/risk-operation/api/applications/latest`
  //     );
  //     const fetchedApplicationData = getLatestApplication.data;

  //     // Get clientPersonaId from application
  //     const clientPersonaId = fetchedApplicationData.clientPersonaId;

  //     // Get KYC agency data from database
  //     const getKycDataFromDatabase = await axios.get(
  //       `${BASE_URL}/trade-directory/api/kyc-agency?clientPersonaId=84` // TO BE CHANGED IN LOCAL: Local will be clientPersonaId=114, dev will be clientPersonaId=84
  //     );
  //     const fetchedKycData = getKycDataFromDatabase.data.data;

  //     const orgId = fetchedApplicationData.organizationId;

  //     // Get Organization data from database
  //     const getOrgDataFromDatabase = await axios.get(
  //       `${BASE_URL}/trade-directory/api/organizations/${orgId}`
  //     );

  //     const fetchedOrgData = getOrgDataFromDatabase.data.data;

  //     setOrganizationId(fetchedOrgData.id);

  //     // console.log(fetchedOrgData);

  //     // Only update state if the component is still mounted
  //     if (isMounted) {
  //       // Helper function to find a match in businessSectors based on the first word
  //       const getMatchingBusinessSector = (input: string): string => {
  //         const firstWord = input.split(' ')[0].toUpperCase();

  //         // Find a match in businessSectors in businessSectors enum based on the first word in the enum code
  //         const matchedSector = businessSectors.find((sector) =>
  //           sector.code.startsWith(firstWord)
  //         );

  //         return matchedSector ? matchedSector.code : ''; // Return matched code or empty string if no match
  //       };

  //       // Extract year from incorporationDate and set it as a Date object
  //       const incorporationDateYear = fetchedKycData.incorporationDate
  //         ? new Date(
  //             new Date(fetchedKycData.incorporationDate).getFullYear(),
  //             0
  //           )
  //         : null;

  //       setYearEstablished(incorporationDateYear); // Set yearEstablished

  //       // Set values in the form using the KYC agency response data
  //       form.setValues({
  //         companyName: fetchedOrgData.organizationName || '',
  //         businessRegistrationNumber:
  //           fetchedOrgData.businessRegistrationNumber || '',
  //         companyType: fetchedOrgData.organizationType || '',
  //         businessSector: getMatchingBusinessSector(
  //           fetchedKycData.businessSector
  //         ),
  //         revenueAmount: fetchedKycData.revenue || 0,
  //         country: fetchedOrgData.country || 0,
  //         registeredAddress:
  //           fetchedKycData.registeredAddress?.[0]?.address || '',
  //       });

  //       notifications.show({
  //         title: 'Success',
  //         message: 'KYC report retrieved successfully',
  //         color: 'green',
  //         autoClose: 5000,
  //       });
  //     }
  //   } catch (error) {
  //     // Only show notifications if the component is still mounted
  //     if (isMounted) {
  //       console.error('Error fetching KYC and org data:', error);

  //       notifications.show({
  //         title: 'Error',
  //         message: 'Failed to fetched form data',
  //         color: 'red',
  //         autoClose: 2000,
  //       });
  //     }
  //   }
  // };

  // fetchKycData();

  // Cleanup function to set `isMounted` to false when the component unmounts
  // This ensures that, if the component unmounts during an asynchronous operation,
  // the code will not run and no notifications will appear.
  //   return () => {
  //     isMounted = false; // Cleanup: set isMounted to false when component unmounts
  //   };
  // }, []);

  const authUser = useGetLogInPersonDetail();

  const organizationId = authUser.data?.organizationId;

  const form = useForm<businessProfileDetails>({
    initialValues: businessProfileFormInitialValues,
    validateInputOnChange: true,
    validate: zodResolver(businessProfileValidator),
  });

  useEffect(() => {
    const fetchOrganizationData = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/trade-directory/api/organizations/${organizationId}`,
          {
            params: {
              includeApplications: false,
              includeKycAgencyReports: false,
            },
          }
        );

        console.log(
          `Fetched Organization Data for organizationId: ${organizationId}:`,
          response.data
        );

        const organizationData = response.data.data;

        form.setValues({
          companyName: organizationData.organizationName || '',
          businessRegistrationNumber:
            organizationData.businessRegistrationNumber || '',
          companyType: organizationData.organizationType || '',
          country: organizationData.country,
        });
      } catch (error) {
        console.error(
          `Failed to fetch organization data organizationId: ${organizationId}:`,
          error
        );
      }
    };

    if (organizationId) fetchOrganizationData();
  }, [authUser.isSuccess, organizationId]);

  const onSubmitForm = async (values: businessProfileDetails) => {
    values.yearEstablished = yearEstablished
      ? yearEstablished.getFullYear().toString()
      : '';

    const dialCode = getDialCodeByCountryCode(values.country); // get dial code based on selected country
    const fullContactNumber = `${dialCode}${values.contactNumber}`.replace(
      /\s+/g,
      ''
    );

    console.log('🚀 ~ onSubmitForm ~ values:', values);

    // Map form values to match API request format
    const apiRequestBody = {
      organizationType: values.companyType,
      country: values.country,
      organizationBusinessSector: values.businessSector,
      businessSectorOther:
        values.businessSectorOther === '' ? null : values.businessSectorOther,
      emailAddress: values.emailAddress,
      contactNumber: fullContactNumber,
      organizationWebsite:
        values.companyWebsite === '' ? null : values.companyWebsite,
      registeredAddress: values.registeredAddress,
      postcode: values.postcode,
      companySize: values.companySize,
      yearEstablished: values.yearEstablished,
      revenueCurrency: values.revenueCurrency,
      revenueAmount: values.revenueAmount,
      taxIdentificationNumber: values.taxIdentificationNumber,
    };

    console.log('🚀 ~ Request Body ~ :', JSON.stringify(apiRequestBody));

    try {
      const response = await axios.patch(
        `${BASE_URL}/trade-directory/api/organizations/${organizationId}`,
        JSON.stringify(apiRequestBody),
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('🎉 ~ API response:', response);

      if (response.status === 200) {
        // Redirect to the next steps once data is successfully stored
        setNextActiveSteps();

        notifications.show({
          title: 'Success',
          message: 'Your data has been successfully stored',
          color: 'green',
          autoClose: 2000,
        });
      }
    } catch (error) {
      console.error('Error fetching form data:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to process form data',
        color: 'red',
        autoClose: 2000,
      });
    }
  };

  const checkFormErrors = () => {
    if (form.validate().hasErrors) {
      notifications.show({
        title: 'Error',
        message: 'Please correct the highlighted fields',
        color: 'red',
        autoClose: 5000,
      });
      return;
    }
  };

  // Get malaysia postcode from 'malaysia-postcodes' package
  // Import package via cdn script tag
  const { allPostcodes } = (window as any).malaysiaPostcodes;

  const allMalaysianPostcodes: string[] = [];

  allPostcodes.forEach((state: any) => {
    state.city.forEach((city: any) => {
      allMalaysianPostcodes.push(...city.postcode);
    });
  });

  // Removes duplicate postcode values
  const uniqueMalaysianPostcodes = Array.from(new Set(allMalaysianPostcodes));

  const getDialCodeByCountryCode = (code: string): string => {
    const country = countriesData.find((c) => c.code === code);
    return country?.dial_code || '';
  };

  const selectedCountryCode = form.values.country;
  const dialCode = getDialCodeByCountryCode(selectedCountryCode);

  return (
    <form
      onSubmit={form.onSubmit((values) => {
        onSubmitForm(values);
      })}
    >
      <div className="mt-7 mr-7 ml-7 flex flex-col items-center">
        <div className="border-2 border-zinc-200 p-2.5 mt-2.5 mb-2.5 rounded">
          <IconBuilding
            style={{ width: '20px', height: '20px', color: 'black' }}
          />
        </div>
        <div className="font-bold">Business Profile</div>
        <div className="text-zinc-400 text-xs">
          Help us understand your company so we can deliver the right financing
          solution.
        </div>
        <div className="flex flex-col w-full px-6">
          <div className="border-2 border-zinc-200 flex flex-col rounded-md p-9 mt-5">
            <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <TextInput
                  label="Company Name"
                  error={form.errors.companyName}
                  withAsterisk
                  {...form.getInputProps('companyName')}
                  required
                  disabled
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6 mt-4">
              <div className="sm:col-span-2">
                <TextInput
                  label="Business Registration No."
                  error={form.errors.businessRegistrationNumber}
                  withAsterisk
                  {...form.getInputProps('businessRegistrationNumber')}
                  disabled
                />
              </div>
              <div className="sm:col-span-2">
                <Select
                  clearable
                  size="xs"
                  label="Company Type"
                  placeholder="Select Company Type"
                  data={companyType.map((company) => ({
                    label: company.name,
                    value: company.code,
                  }))}
                  error={form.errors.companyType}
                  withAsterisk
                  searchable
                  disabled
                  styles={{
                    label: { fontWeight: 250 },
                  }}
                  {...form.getInputProps('companyType')}
                />
              </div>

              <div className="sm:col-span-2">
                <Select
                  size="xs"
                  label="Country"
                  placeholder="Select Country"
                  data={countries.map((country) => ({
                    label: country.name,
                    value: country.code,
                  }))}
                  error={form.errors.country}
                  withAsterisk
                  searchable
                  disabled
                  styles={{
                    label: { fontWeight: 250 },
                  }}
                  clearable
                  {...form.getInputProps('country')}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6 mt-4">
              <div className="sm:col-span-2">
                <Select
                  size="xs"
                  label={
                    <div className="flex items-center gap-1">
                      <Text size="xs" style={{ fontWeight: 250 }}>
                        Business Sector
                      </Text>
                      <span className="text-red-500">*</span>
                      <Tooltip
                        label="Choose the industry closest to your primary business activity"
                        withArrow
                      >
                        <span className="cursor-pointer ">
                          <IconInfoCircle size={12} className="text-zinc-500" />
                        </span>
                      </Tooltip>
                    </div>
                  }
                  placeholder="Select Sector"
                  data={businessSectors.map((sector) => ({
                    label: sector.name,
                    value: sector.code,
                  }))}
                  error={form.errors.businessSector}
                  searchable
                  styles={{
                    label: { fontWeight: 250 },
                  }}
                  clearable
                  {...form.getInputProps('businessSector')}
                  required
                  withAsterisk={false}
                />
              </div>

              {form.getValues().businessSector == 'OTHERS' && (
                <div className="sm:col-span-2">
                  <TextInput
                    label="Specify your Business Sector"
                    placeholder="e.g. Agriculture"
                    key={form.key('businessSectorOther')}
                    {...form.getInputProps('businessSectorOther')}
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6 mt-4">
              <div className="sm:col-span-2">
                <TextInput
                  label="Email Address"
                  withAsterisk
                  error={form.errors.emailAddress}
                  {...form.getInputProps('emailAddress')}
                />
              </div>

              <div className="sm:col-span-2">
                <TextInput
                  label="Contact Number"
                  withAsterisk
                  required
                  value={`${dialCode}${form.values.contactNumber ?? ''}`}
                  onChange={(e) => {
                    const numberOnly = e.currentTarget.value
                      .replace(dialCode, '')
                      .trim();
                    form.setFieldValue('contactNumber', numberOnly);
                  }}
                  error={form.errors.contactNumber}
                />
              </div>
              <div className="sm:col-span-2">
                <TextInput
                  label="Company Website"
                  error={form.errors.companyWebsite}
                  {...form.getInputProps('companyWebsite')}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6 mt-4">
              <div className="sm:col-span-6">
                <Textarea
                  label="Registered Address"
                  error={form.errors.registeredAddress}
                  withAsterisk
                  required
                  {...form.getInputProps('registeredAddress')}
                  minRows={2}
                  maxRows={4}
                  autosize
                  styles={{
                    input: {
                      fontSize: '12px',
                      lineHeight: '1.5',
                    },
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6 mt-4">
              <div className="sm:col-span-2">
                {form.getValues().country === 'MY' ? (
                  <Select
                    clearable
                    size="xs"
                    label="Postcode (Malaysia)"
                    placeholder="Select Malaysian Postcode"
                    data={uniqueMalaysianPostcodes.map((pc) => ({
                      label: pc,
                      value: pc,
                    }))}
                    error={form.errors.postcode}
                    searchable
                    withAsterisk
                    styles={{
                      label: { fontWeight: 250 },
                    }}
                    {...form.getInputProps('postcode')}
                    required
                  />
                ) : (
                  <TextInput
                    label="Postcode"
                    error={form.errors.postcode}
                    withAsterisk
                    required
                    {...form.getInputProps('postcode')}
                  />
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6 mt-4">
              <div className="sm:col-span-2">
                <YearPickerInput
                  label="Year Established"
                  value={yearEstablished}
                  // {...form.getInputProps('yearEstablished')}
                  onChange={(date) => {
                    setYearEstablished(date);
                    form.setFieldValue(
                      'yearEstablished',
                      date ? date.getFullYear().toString() : ''
                    ); // getFullYear() will return date object, set the yearEstablished field value into a string e.g. "2021"
                  }}
                  styles={{
                    label: { fontWeight: 250 },
                  }}
                  withAsterisk
                  size="xs"
                  clearable
                  error={form.errors.yearEstablished}
                  required
                  pointer={true}
                  minDate={new Date(1990, 1)}
                  maxDate={new Date(new Date().getFullYear(), 1)}
                  rightSection={
                    <IconCalendar
                      style={{ width: '15px', height: '15px' }}
                      stroke={1.5}
                    />
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <Select
                  clearable
                  size="xs"
                  label={
                    <div className="flex items-center gap-1">
                      <Text size="xs" style={{ fontWeight: 250 }}>
                        Company Size
                      </Text>
                      <span className="text-red-500">*</span>
                      <Tooltip
                        label="Select the bracket that best describes your current employee headcount"
                        withArrow
                      >
                        <span className="cursor-pointer ">
                          <IconInfoCircle size={12} className="text-zinc-500" />
                        </span>
                      </Tooltip>
                    </div>
                  }
                  placeholder="Select Company Size"
                  data={numberOfEmployees.map((companySize) => ({
                    label: companySize.name,
                    value: companySize.code,
                  }))}
                  error={form.errors.companySize}
                  searchable
                  withAsterisk={false}
                  styles={{
                    label: { fontWeight: 250 },
                  }}
                  {...form.getInputProps('companySize')}
                  required
                />
              </div>
              <div className="sm:col-span-2 flex gap-2 sm:grid-cols-3">
                <Select
                  clearable
                  size="xs"
                  label="Revenue"
                  className=" w-1/3"
                  data={currencyList.map((currency) => ({
                    label: currency.label,
                    value: currency.value,
                  }))}
                  withAsterisk
                  searchable
                  styles={{
                    label: { fontWeight: 250 },
                  }}
                  {...form.getInputProps('revenueCurrency')}
                  error={form.errors.revenueCurrency}
                  required
                />
                <div
                  className={`flex-1 flex ${
                    form.errors.revenueAmount ? 'justify-end' : ''
                  }`}
                >
                  <NumberInput
                    labelProps={{ style: { visibility: 'hidden' } }}
                    label="Revenue Amount"
                    size="xs"
                    decimalScale={2}
                    allowNegative={false}
                    thousandSeparator=","
                    className="flex-1"
                    hideControls
                    min={0}
                    {...form.getInputProps('revenueAmount')}
                    error={form.errors.revenueAmount}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6 mt-4">
              <div className="sm:col-span-2">
                <TextInput
                  label="Tax Identification Number (TIN)"
                  withAsterisk
                  required
                  {...form.getInputProps('taxIdentificationNumber')}
                  error={form.errors.taxIdentificationNumber}
                />
              </div>
            </div>
          </div>
          <div className="flex self-end mt-5 mb-5">
            <Button
              type="submit"
              variant="primary"
              className="w-full md:w-auto"
              style={{
                color: '#ffffff',
                backgroundColor: color.GOLD,
                marginTop: '30px',
              }}
              onClick={checkFormErrors}
            >
              Save & continue
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default ClientOnboardingBusinessProfileForm;
