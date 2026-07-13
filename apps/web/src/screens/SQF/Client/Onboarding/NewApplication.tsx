import {
  Button,
  Divider,
  Group,
  LoadingOverlay,
  Radio,
  Select,
} from '@mantine/core';
import TextInput from 'components/TextBox/TextBox';
import { color } from 'constants/color';
import { companyType } from 'constants/companyType';
import React, { useState } from 'react';
import {
  createNewApplicationDetails,
  createNewApplicationInitialValues,
} from './Forms/Components/InitialValues';
import { useForm, zodResolver } from '@mantine/form';
import { createNewApplicationValidator } from 'screens/SQF/Client/Onboarding/Forms/Components/FormValidation';
import { notifications } from '@mantine/notifications';
import axios from 'axios';
import { IconFlag3, IconDiscountCheck } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { BASE_URL } from 'constants/constant';
import { countries, countriesData } from 'constants/countries';

const NewApplication = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [visible, { open: showOverlay, close: hideOverlay }] =
    useDisclosure(false); // Using explicit open and close

  const form = useForm<createNewApplicationDetails>({
    initialValues: createNewApplicationInitialValues,
    validateInputOnChange: true,
    validate: zodResolver(createNewApplicationValidator),
  });

  const getDialCodeByCountryCode = (code: string): string => {
    const country = countriesData.find((c) => c.code === code);
    return country?.dial_code || '';
  };

  const selectedCountryCode = form.values.country;
  const dialCode = getDialCodeByCountryCode(selectedCountryCode);

  const onSubmitForm = async (values: createNewApplicationDetails) => {
    console.log('🚀 ~ onSubmitForm ~ values:', values);

    const fullMobileNumber =
      `${dialCode}${values.personInCharge.contactNumber}`.replace(/\s+/g, '');

    const apiRequestBody = {
      organization: {
        organizationName: values.companyName,
        businessRegistrationNumber: values.businessRegistrationNumber,
        organizationType: values.companyType,
        country: values.country,
      },
      applicationPersona: values.applicationPersona.toUpperCase(),
      personInCharge: [
        {
          person: {
            name: values.personInCharge.name,
            mobileNumber: fullMobileNumber,
            email: values.personInCharge.emailAddress,
          },
          organizationPerson: {
            designation: values.personInCharge.designation,
          },
        },
      ],
    };

    try {
      showOverlay(); // Show the loader before starting the request

      const response = await axios.post(
        `${BASE_URL}/risk-operation/api/applications`,
        JSON.stringify(apiRequestBody),
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('🎉 ~ API response:', response);

      if (response.status === 201) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsSubmitted(true);

        // notifications.show({
        //   title: 'Success',
        //   message: 'Your data has been successfully stored',
        //   color: 'green',
        //   autoClose: 2000,
        // });
      }
    } catch (error) {
      console.error('Error process form data:', error);

      notifications.show({
        title: 'Error',
        message: 'Failed to process form data',
        color: 'red',
        autoClose: 2000,
      });
    } finally {
      hideOverlay(); // Hide the loader after completion
    }
  };

  const handlePersonaChange = (value: string) => {
    form.setFieldValue('applicationPersona', value);
  };

  return (
    <div className="flex w-full min-h-screen">
      <LoadingOverlay
        visible={visible}
        zIndex={1000}
        overlayProps={{ radius: 'sm', blur: 2 }}
        loaderProps={{ color: color.GOLD }}
      />
      <div
        className="w-2/5 flex items-center justify-center bg-red-200"
        style={{
          backgroundColor: color.GOLD,
        }}
      ></div>
      <div className="flex-1 flex items-center justify-center">
        {isSubmitted ? (
          // Success message on the right side
          <div className="p-8 w-full ">
            <div className="border-zinc-200 p-3.5 mb-4 border rounded-lg w-fit">
              <IconDiscountCheck
                style={{ width: '20px', height: '20px', color: '#52525B' }}
              />
            </div>
            <h1 className="font-bold text-lg mb-1">
              Application Submitted Successfully! 🎉
            </h1>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Thank you for submitting your application. An email has been sent
              to your Person in Charge (PIC) with instructions on the next
              steps. Please ensure they check their inbox to proceed with the
              application.
            </p>
            <p className="text-xs text-zinc-600 mt-9">
              For any questions, please contact support at{' '}
              <a href="mailto:support@company.com" className="text-teal-600">
                support@synlian.com
              </a>{' '}
              or call (123) 456-7890.
            </p>
          </div>
        ) : (
          <form
            onSubmit={form.onSubmit((values) => {
              onSubmitForm(values);
            })}
          >
            <div className="p-8 w-full h-fit">
              <div className="border-zinc-200 p-3.5 mb-4 border rounded-lg w-fit">
                <IconFlag3
                  style={{ width: '20px', height: '20px', color: '#52525B' }}
                />
              </div>
              <h1 className="font-bold text-lg mb-1">
                Start Your Application for Financing 🚀
              </h1>
              <p className="text-xs text-zinc-600 mb-8">
                We’re here to help you access funds quickly and smoothly. Start
                your factoring and financing application by creating an account.
                Save progress, upload documents securely, and track your
                application with ease.
              </p>
              <div className="mt-7 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-7">
                <div className="sm:col-span-3">
                  <TextInput
                    label="Company Name"
                    withAsterisk
                    required
                    {...form.getInputProps('companyName')}
                  />
                </div>

                <div className="sm:col-span-3">
                  <TextInput
                    label="Business Registration No."
                    withAsterisk
                    required
                    {...form.getInputProps('businessRegistrationNumber')}
                  />
                </div>
              </div>
              <div className="mt-7 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-7 ">
                <div className="sm:col-span-3">
                  <Select
                    clearable
                    size="xs"
                    label="Company Type"
                    placeholder="Select Company Type"
                    data={companyType.map((company) => ({
                      label: company.name,
                      value: company.code,
                    }))}
                    withAsterisk
                    searchable
                    styles={{
                      label: { fontWeight: 250 },
                    }}
                    {...form.getInputProps('companyType')}
                  />
                </div>
                <div className="sm:col-span-3">
                  <Select
                    clearable
                    size="xs"
                    label="Country"
                    placeholder="Select Country"
                    data={countries.map((country) => ({
                      label: country.name,
                      value: country.code,
                    }))}
                    withAsterisk
                    searchable
                    styles={{
                      label: { fontWeight: 250 },
                    }}
                    {...form.getInputProps('country')}
                  />
                </div>
              </div>
              <div className="mt-7 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-7 ">
                <div className="sm:col-span-7">
                  <Radio.Group
                    name="persona"
                    label="Applying as?"
                    withAsterisk
                    styles={{
                      label: { fontSize: '12px' },
                    }}
                    value={form.values.applicationPersona || ''} // Ensure initial value is set
                    onChange={handlePersonaChange}
                  >
                    <Group mt="xs">
                      <Radio
                        value="borrower"
                        label="Borrower"
                        styles={{
                          label: { fontSize: '12px', fontWeight: 250 }, // Radio button label styling
                        }}
                        color={color.GOLD}
                      />
                      <Radio
                        value="supplier"
                        label="Supplier"
                        styles={{
                          label: { fontSize: '12px', fontWeight: 250 }, // Radio button label styling
                        }}
                        color={color.GOLD}
                      />
                      <Radio
                        value="investor"
                        label="Investor"
                        styles={{
                          label: { fontSize: '12px', fontWeight: 250 }, // Radio button label styling
                        }}
                        color={color.GOLD}
                      />
                    </Group>
                  </Radio.Group>
                </div>
              </div>
              <div className="my-8">
                <Divider my="md" />
              </div>
              <h2 className="font-bold text-xs">Person In-Charge</h2>
              <div className="mt-7 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-7">
                <div className="sm:col-span-3">
                  <TextInput
                    label="Name"
                    withAsterisk
                    required
                    {...form.getInputProps('personInCharge.name')}
                  />
                </div>
                <div className="sm:col-span-3">
                  <TextInput
                    label="Contact Number"
                    withAsterisk
                    required
                    value={`${dialCode}${
                      form.values.personInCharge.contactNumber ?? ''
                    }`}
                    onChange={(e) => {
                      const numberOnly = e.currentTarget.value
                        .replace(dialCode, '')
                        .trim();
                      form.setFieldValue(
                        'personInCharge.contactNumber',
                        numberOnly
                      );
                    }}
                  />
                </div>
              </div>
              <div className="mt-7 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-7">
                <div className="sm:col-span-3">
                  <TextInput
                    label="Email Address"
                    withAsterisk
                    required
                    {...form.getInputProps('personInCharge.emailAddress')}
                  />
                </div>
                <div className="sm:col-span-3">
                  <TextInput
                    label="Designation"
                    withAsterisk
                    required
                    {...form.getInputProps('personInCharge.designation')}
                  />
                </div>
              </div>
              <div className="pt-8">
                <Button
                  variant="primary"
                  className="w-full md:w-auto bg-[#B0A275] text-white"
                  style={{
                    color: '#ffffff',
                    backgroundColor: color.GOLD,
                  }}
                  type="submit"
                  disabled={visible}
                >
                  Submit
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default NewApplication;
