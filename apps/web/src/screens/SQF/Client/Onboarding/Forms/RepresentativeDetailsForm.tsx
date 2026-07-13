import React, { useEffect, useRef, useState } from 'react';
import { useForm, zodResolver } from '@mantine/form';
import {
  TextInput,
  Group,
  ActionIcon,
  Button,
  Divider,
  Radio,
  NumberInput,
  Select,
  Modal,
  Text,
  Tooltip,
  Textarea,
  Checkbox,
} from '@mantine/core';
import { randomId, useDisclosure } from '@mantine/hooks';
import {
  IconCheck,
  IconInfoCircle,
  IconPlus,
  IconTrash,
  IconUsers,
} from '@tabler/icons-react';
import { guarantorRelationship } from 'constants/guarantorRelationship';
import { notifications } from '@mantine/notifications';
import {
  PersonInCharge,
  Director,
  Shareholder,
  Guarantors,
  PersonInChargeFormInitialValues,
  DirectorFormInitialValues,
  ShareholderFormInitialValues,
  GuarantorsFormInitialValues,
} from 'screens/SQF/Client/Onboarding/Forms/Components/InitialValues';
import { color } from 'constants/color';
import axios from 'axios';
import { BASE_URL } from 'constants/constant';
import useUpdateOnboardAt from 'hooks/updateOnboardAt';
import {
  icOrPassportSchema,
  contactNumber,
  email,
  formValidator,
  nonEmptyStringWithMinLength,
} from 'screens/SQF/Client/Onboarding/Forms/Components/FormValidation';

interface Props {
  setNextActiveSteps: () => void; // To redirect to next stepper
}

// for onChange to capitalize name, designation and address
function capitalizeInputFormField(str: string) {
  return str.toUpperCase();
}

const ClientOnboardingRepresentativeDetailsForm: React.FC<Props> = ({
  setNextActiveSteps,
}) => {
  const [applicationId, setApplicationId] = useState<number | null>(null);
  const updateOnboardAtMutation = useUpdateOnboardAt();

  useEffect(() => {
    const fetchKycData = async () => {
      try {
        // Get the latest application in database
        const getLatestApplication = await axios.get(
          `${BASE_URL}/risk-operation/api/applications/latest`
        );

        const fetchedApplicationData = getLatestApplication.data;
        const organizationId = fetchedApplicationData.organizationId;
        setApplicationId(fetchedApplicationData.id);

        // Get the latest application in database
        const getApplicationData = await axios.get(
          `${BASE_URL}/trade-directory/api/organizations/${organizationId}?includeApplications=true&includeKycAgencyReports=true`
        );

        const applicationData = getApplicationData.data.data.applications;

        // Filter the applicationData array to get the matching applicationID
        const matchingApplication = applicationData.find(
          (application: any) => application.id === fetchedApplicationData.id
        );

        console.log(matchingApplication);

        // Get KYC agency data from database   NOTE: remove population of representative details data
        // const getKycDataFromDatabase = await axios.get(
        //   `${BASE_URL}/trade-directory/api/kyc-agency?clientPersonaId=84` // TO BE CHANGED IN LOCAL: Local will be clientPersonaId=114, dev will be clientPersonaId=84
        // );
        // const fetchedKycData = getKycDataFromDatabase.data.data;

        form.setValues({
          personInCharge: {
            name: matchingApplication.applicationPersons[0].name,
            emailAddress: matchingApplication.applicationPersons[0].email,
            contactNumber:
              matchingApplication.applicationPersons[0].mobileNumber,
            designation:
              matchingApplication.applicationPersons[0].designations[0],
          },
          // NOTE: remove populate of shareholders and directors data from the KYC agency
          // shareholders: fetchedKycData.shareholders.map(
          //   (shareholder: {
          //     name: any;
          //     address: any;
          //     localNumber: any;
          //     shareholdingPercentage: any;
          //   }) => ({
          //     name: shareholder.name || '',
          //     address: shareholder.address || '',
          //     identificationNumber: shareholder.localNumber || '',
          //     shareholdingPercentage: shareholder.shareholdingPercentage || 0,
          //   })
          // ),
          // directors: fetchedKycData.managementDetails
          //   .filter(
          //     (director: { designation: string }) =>
          //       director.designation === 'DIRECTOR'
          //   ) // Filter only directors
          //   .map(
          //     (director: {
          //       name: any;
          //       address: any;
          //       designation: any;
          //       localNumber: any;
          //     }) => ({
          //       name: director.name || '',
          //       address: director.address || '',
          //       designation: director.designation || '',
          //       identificationNumber: director.localNumber || '',
          //       authoriseSignatory: null,
          //     })
          //   ),
        });
      } catch (err) {
        console.error('Error fetching data:', err);

        notifications.show({
          title: 'Error',
          message: 'Failed to fetched form data',
          color: 'red',
          autoClose: 2000,
        });
      }
    };

    fetchKycData();
  }, []);

  const form = useForm<{
    personInCharge: PersonInCharge;
    directors: Director[];
    shareholders: Shareholder[];
    guarantors: Guarantors[];
  }>({
    validateInputOnChange: true,
    initialValues: {
      personInCharge: PersonInChargeFormInitialValues,
      directors: DirectorFormInitialValues,
      shareholders: ShareholderFormInitialValues,
      guarantors: GuarantorsFormInitialValues,
    },
    validate: zodResolver(formValidator),
  });

  const [opened, { open, close }] = useDisclosure(false);

  const personInChargeField = () => (
    <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-8">
      <div className="sm:col-span-2">
        <TextInput
          label="Name"
          withAsterisk
          required
          size="xs"
          styles={{
            label: { fontWeight: 250 },
          }}
          disabled
          error={form.errors['personInCharge.name']}
          {...form.getInputProps(`personInCharge.name`)}
        />
      </div>
      <div className="sm:col-span-2">
        <TextInput
          label="Contact Number"
          withAsterisk
          required
          size="xs"
          styles={{
            label: { fontWeight: 250 },
          }}
          disabled
          error={form.errors['personInCharge.contactNumber']}
          {...form.getInputProps(`personInCharge.contactNumber`)}
        />
      </div>
      <div className="sm:col-span-2">
        <TextInput
          label="Email Address"
          withAsterisk
          required
          size="xs"
          styles={{
            label: { fontWeight: 250 },
          }}
          disabled
          error={form.errors['personInCharge.emailAddress']}
          {...form.getInputProps(`personInCharge.emailAddress`)}
        />
      </div>
      <div className="sm:col-span-2">
        <TextInput
          label="Designation"
          withAsterisk
          required
          size="xs"
          styles={{
            label: { fontWeight: 250 },
          }}
          disabled
          error={form.errors['personInCharge.designation']}
          {...form.getInputProps(`personInCharge.designation`)}
        />
      </div>
    </div>
  );

  const directorFields = form.values.directors.map((director, index) => (
    <div key={director.key}>
      {index > 0 && <Divider my="md" />}
      <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
        <div className="sm:col-span-4">
          <TextInput
            size="xs"
            label="Name"
            withAsterisk
            required
            value={form.values.directors[index].name}
            onChange={(event) =>
              form.setFieldValue(
                `directors.${index}.name`,
                capitalizeInputFormField(event.currentTarget.value)
              )
            }
            error={form.errors[`directors.${index}.name`]}
            styles={{
              label: { fontWeight: 250 },
            }}
          />
        </div>
        <div className="sm:col-span-2">
          <TextInput
            label="Designation"
            error={form.errors[`directors.${index}.designation`]}
            withAsterisk
            required
            size="xs"
            styles={{
              label: { fontWeight: 250 },
            }}
            value={form.values.directors[index].designation}
            onChange={(event) =>
              form.setFieldValue(
                `directors.${index}.designation`,
                capitalizeInputFormField(event.currentTarget.value)
              )
            }
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 mt-4">
        <div className="sm:col-span-2">
          <TextInput
            label={
              <div className="flex items-center gap-1">
                <Text size="xs" style={{ fontWeight: 250 }}>
                  IC / Passport Number
                </Text>
                <span className="text-red-500">*</span>
                <Tooltip
                  label="Enter IC without dashes or a valid passport number"
                  withArrow
                >
                  <span className="cursor-pointer ">
                    <IconInfoCircle size={12} className="text-zinc-500" />
                  </span>
                </Tooltip>
              </div>
            }
            error={form.errors[`directors.${index}.identificationNumber`]}
            withAsterisk={false}
            required
            size="xs"
            styles={{
              label: { fontWeight: 250 },
            }}
            {...form.getInputProps(`directors.${index}.identificationNumber`)}
          />
        </div>
        <div className="sm:col-span-2">
          <TextInput
            label="Contact Number"
            error={form.errors[`directors.${index}.contactNumber`]}
            withAsterisk
            required
            size="xs"
            styles={{
              label: { fontWeight: 250 },
            }}
            {...form.getInputProps(`directors.${index}.contactNumber`)}
          />
        </div>
        <div className="sm:col-span-2">
          <TextInput
            label="Email Address"
            error={form.errors[`directors.${index}.emailAddress`]}
            withAsterisk
            required
            size="xs"
            styles={{
              label: { fontWeight: 250 },
            }}
            {...form.getInputProps(`directors.${index}.emailAddress`)}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 mt-4">
        <div className="sm:col-span-6">
          <Textarea
            label="Address"
            error={form.errors[`directors.${index}.address`]}
            withAsterisk
            required
            size="xs"
            styles={{
              label: { fontWeight: 250 },
              input: {
                fontSize: '12px',
                lineHeight: '1.5',
              },
            }}
            minRows={2}
            maxRows={4}
            autosize
            value={form.values.directors[index].address}
            onChange={(event) =>
              form.setFieldValue(
                `directors.${index}.address`,
                capitalizeInputFormField(event.currentTarget.value)
              )
            }
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 mt-4">
        <div className="sm:col-span-2">
          <Radio.Group
            name={`directors.${index}.authoriseSignatory`} // Important! Update 'name' to reflect dynamic index, and group the radio button together
            label="Authorise Signatory"
            withAsterisk
            className="mt-px mb-2"
            styles={{
              label: { fontSize: '0.75rem', fontWeight: 250 },
            }}
            error={form.errors[`directors.${index}.authoriseSignatory`]}
            value={
              form.getInputProps(`directors.${index}.authoriseSignatory`)
                .value === null
                ? ''
                : form.getInputProps(`directors.${index}.authoriseSignatory`)
                      .value
                  ? 'true'
                  : 'false'
            }
            onChange={(value) => {
              form.setFieldValue(
                `directors.${index}.authoriseSignatory`,
                value === 'true' ? true : value === 'false' ? false : null
              );
            }} // Radio button only accept string, use value params in setFieldValue to turn value into boolean
          >
            <Group className="mt-1">
              <Radio
                label="Yes"
                value="true"
                color={color.GOLD}
                styles={{
                  label: { fontSize: '0.75rem', fontWeight: 250 },
                }}
              />
              <Radio
                label="No"
                value="false"
                color={color.GOLD}
                styles={{
                  label: { fontSize: '0.75rem', fontWeight: 250 },
                }}
              />
            </Group>
          </Radio.Group>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 mt-4">
        <div className="sm:col-span-1">
          <Checkbox
            label="Also a Shareholder"
            size="xs"
            checked={form.values.directors[index].alsoShareholder}
            disabled={
              !director.name &&
              !director.designation &&
              !director.identificationNumber &&
              !director.contactNumber &&
              !director.emailAddress &&
              !director.address
            }
            onChange={(event) => {
              const checked = event.currentTarget.checked;
              form.setFieldValue(`directors.${index}.alsoShareholder`, checked);

              const director = form.values.directors[index];
              const sourceKey = `director-${index}`;

              if (checked) {
                const exists = form.values.shareholders.some(
                  (sh) => sh.source === sourceKey
                );
                if (!exists) {
                  form.insertListItem('shareholders', {
                    name: director.name,
                    designation: director.designation,
                    identificationNumber: director.identificationNumber,
                    contactNumber: director.contactNumber,
                    emailAddress: director.emailAddress,
                    address: director.address,
                    shareholdingPercentage: 0,
                    key: Math.random().toString(36).slice(2),
                    source: sourceKey,
                  });
                }
              } else {
                const updated = form.values.shareholders.filter(
                  (sh) => sh.source !== sourceKey
                );
                form.setFieldValue('shareholders', updated);
              }
            }}
          />
        </div>
        <div className="sm:col-span-1">
          <Checkbox
            label="Also a Guarantor"
            size="xs"
            checked={form.values.directors[index].alsoGuarantor}
            disabled={
              !director.name &&
              !director.designation &&
              !director.identificationNumber &&
              !director.contactNumber &&
              !director.emailAddress &&
              !director.address
            }
            onChange={(event) => {
              const checked = event.currentTarget.checked;
              form.setFieldValue(`directors.${index}.alsoGuarantor`, checked);

              const director = form.values.directors[index];
              const sourceKey = `director-${index}`;

              if (checked) {
                const exists = form.values.guarantors.some(
                  (g) => g.source === sourceKey
                );

                if (!exists) {
                  form.insertListItem('guarantors', {
                    name: director.name,
                    designation: director.designation,
                    identificationNumber: director.identificationNumber,
                    contactNumber: director.contactNumber,
                    emailAddress: director.emailAddress,
                    address: director.address,
                    relationshipToApplicant: '',
                    key: Math.random().toString(36).slice(2),
                    source: sourceKey,
                  });
                }
              } else {
                // Remove only the entry added via this director
                const remaining = form.values.guarantors.filter(
                  (g) => g.source !== sourceKey
                );
                form.setFieldValue('guarantors', remaining);
              }
            }}
          />
        </div>
      </div>
      <ActionIcon
        color="red"
        className="mt-6"
        onClick={() => {
          const sourceKey = `director-${index}`;

          // Remove the director
          form.removeListItem('directors', index);

          // Remove linked guarantor if synced
          const updatedGuarantors = form.values.guarantors.filter(
            (g) => g.source !== sourceKey
          );
          form.setFieldValue('guarantors', updatedGuarantors);

          // Remove linked shareholder if synced
          const updatedShareholders = form.values.shareholders.filter(
            (s) => s.source !== sourceKey
          );
          form.setFieldValue('shareholders', updatedShareholders);
        }}
        disabled={form.values.directors.length === 1}
      >
        {' '}
        <IconTrash size="1rem" />
      </ActionIcon>
    </div>
  ));

  const shareholderFields = form.values.shareholders.map(
    (shareholder, index) => {
      return (
        <div key={shareholder.key}>
          {index > 0 && <Divider my="md" />}
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-2">
              <TextInput
                label="Name"
                error={form.errors[`shareholders.${index}.name`]}
                withAsterisk
                required
                size="xs"
                styles={{
                  label: { fontWeight: 250 },
                }}
                value={form.values.shareholders[index].name}
                onChange={(event) =>
                  form.setFieldValue(
                    `shareholders.${index}.name`,
                    capitalizeInputFormField(event.currentTarget.value)
                  )
                }
              />
            </div>
            <div className="sm:col-span-2">
              <TextInput
                label="Designation"
                error={form.errors[`shareholders.${index}.designation`]}
                withAsterisk
                required
                size="xs"
                styles={{
                  label: { fontWeight: 250 },
                }}
                value={form.values.shareholders[index].designation}
                onChange={(event) =>
                  form.setFieldValue(
                    `shareholders.${index}.designation`,
                    capitalizeInputFormField(event.currentTarget.value)
                  )
                }
              />
            </div>
            <div className="sm:col-span-2">
              <NumberInput
                label={
                  <div className="flex items-center gap-1">
                    <Text size="xs" style={{ fontWeight: 250 }}>
                      Equity Stake (%)
                    </Text>
                    <span className="text-red-500">*</span>
                    <Tooltip
                      label="As per your company’s share register"
                      withArrow
                    >
                      <span className="cursor-pointer ">
                        <IconInfoCircle size={12} className="text-zinc-500" />
                      </span>
                    </Tooltip>
                  </div>
                }
                styles={{
                  label: { fontWeight: 250 },
                }}
                error={
                  form.errors[`shareholders.${index}.shareholdingPercentage`]
                }
                size="xs"
                required
                withAsterisk={false}
                hideControls
                allowNegative={false}
                {...form.getInputProps(
                  `shareholders.${index}.shareholdingPercentage`
                )}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 mt-4">
            <div className="sm:col-span-2">
              <TextInput
                label={
                  <div className="flex items-center gap-1">
                    <Text size="xs" style={{ fontWeight: 250 }}>
                      IC / Passport Number
                    </Text>
                    <span className="text-red-500">*</span>
                    <Tooltip
                      label="Enter IC without dashes or a valid passport number"
                      withArrow
                    >
                      <span className="cursor-pointer ">
                        <IconInfoCircle size={12} className="text-zinc-500" />
                      </span>
                    </Tooltip>
                  </div>
                }
                required
                withAsterisk={false}
                size="xs"
                styles={{ label: { fontWeight: 250 } }}
                {...form.getInputProps(
                  `shareholders.${index}.identificationNumber`
                )}
                error={
                  form.errors[`shareholders.${index}.identificationNumber`]
                }
              />
            </div>
            <div className="sm:col-span-2">
              <TextInput
                label="Contact Number"
                error={form.errors[`shareholders.${index}.contactNumber`]}
                withAsterisk
                required
                size="xs"
                styles={{
                  label: { fontWeight: 250 },
                }}
                {...form.getInputProps(`shareholders.${index}.contactNumber`)}
              />
            </div>
            <div className="sm:col-span-2">
              <TextInput
                label="Email Address"
                error={form.errors[`shareholders.${index}.emailAddress`]}
                withAsterisk
                required
                size="xs"
                styles={{
                  label: { fontWeight: 250 },
                }}
                {...form.getInputProps(`shareholders.${index}.emailAddress`)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 mt-4">
            <div className="sm:col-span-6">
              <Textarea
                label="Address"
                error={form.errors[`shareholders.${index}.address`]}
                withAsterisk
                required
                size="xs"
                styles={{
                  label: { fontWeight: 250 },
                  input: {
                    fontSize: '12px',
                    lineHeight: '1.5',
                  },
                }}
                value={form.values.shareholders[index].address}
                onChange={(event) =>
                  form.setFieldValue(
                    `shareholders.${index}.address`,
                    capitalizeInputFormField(event.currentTarget.value)
                  )
                }
                minRows={2}
                maxRows={4}
                autosize
              />
            </div>
          </div>
          <ActionIcon
            color="red"
            className="mt-6"
            onClick={() => {
              const sourceKey = form.values.shareholders[index].source;

              // Remove the shareholder
              form.removeListItem('shareholders', index);

              // If the shareholder was synced from a director, uncheck the director's checkbox
              if (sourceKey?.startsWith('director-')) {
                const directorIndex = parseInt(sourceKey.split('-')[1], 10);
                form.setFieldValue(
                  `directors.${directorIndex}.alsoShareholder`,
                  false
                );
              }
            }}
            disabled={form.values.shareholders.length === 1}
          >
            <IconTrash size="1rem" />
          </ActionIcon>
        </div>
      );
    }
  );

  const guarantorFields = form.values.guarantors.map((guarantor, index) => (
    <div key={guarantor.key}>
      {index > 0 && <Divider my="md" />}
      <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
        <div className="sm:col-span-2">
          <TextInput
            label="Name"
            error={form.errors[`guarantors.${index}.name`]}
            size="xs"
            styles={{
              label: { fontWeight: 250 },
            }}
            value={form.values.guarantors[index].name}
            onChange={(event) =>
              form.setFieldValue(
                `guarantors.${index}.name`,
                capitalizeInputFormField(event.currentTarget.value)
              )
            }
          />
        </div>
        <div className="sm:col-span-2">
          <TextInput
            label="Designation"
            error={form.errors[`guarantors.${index}.designation`]}
            size="xs"
            styles={{
              label: { fontWeight: 250 },
            }}
            value={form.values.guarantors[index].designation}
            onChange={(event) =>
              form.setFieldValue(
                `guarantors.${index}.designation`,
                capitalizeInputFormField(event.currentTarget.value)
              )
            }
          />
        </div>
        <div className="sm:col-span-2">
          <Select
            clearable
            size="xs"
            label="Relationship to Applicant"
            placeholder="Select Relationship to Applicant"
            data={guarantorRelationship.map((guarantorRelationship) => ({
              label: guarantorRelationship.label,
              value: guarantorRelationship.value,
            }))}
            error={form.errors[`guarantors.${index}.relationshipToApplicant`]}
            searchable
            styles={{
              label: { fontWeight: 250 },
            }}
            {...form.getInputProps(
              `guarantors.${index}.relationshipToApplicant`
            )}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 mt-4">
        <div className="sm:col-span-2">
          <TextInput
            label={
              <div className="flex items-center gap-1">
                <Text size="xs" style={{ fontWeight: 250 }}>
                  IC / Passport Number
                </Text>
                <Tooltip
                  label="Enter IC without dashes or a valid passport number"
                  withArrow
                >
                  <span className="cursor-pointer ">
                    <IconInfoCircle size={12} className="text-zinc-500" />
                  </span>
                </Tooltip>
              </div>
            }
            error={form.errors[`guarantors.${index}.identificationNumber`]}
            size="xs"
            styles={{
              label: { fontWeight: 250 },
            }}
            {...form.getInputProps(`guarantors.${index}.identificationNumber`)}
          />
        </div>
        <div className="sm:col-span-2">
          <TextInput
            label="Contact Number"
            error={form.errors[`guarantors.${index}.contactNumber`]}
            size="xs"
            styles={{
              label: { fontWeight: 250 },
            }}
            {...form.getInputProps(`guarantors.${index}.contactNumber`)}
          />
        </div>
        <div className="sm:col-span-2">
          <TextInput
            label="Email Address"
            error={form.errors[`guarantors.${index}.emailAddress`]}
            size="xs"
            styles={{
              label: { fontWeight: 250 },
            }}
            {...form.getInputProps(`guarantors.${index}.emailAddress`)}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 mt-4">
        <div className="sm:col-span-6">
          <Textarea
            label="Address"
            size="xs"
            error={form.errors[`guarantors.${index}.address`]}
            styles={{
              label: { fontWeight: 250 },
              input: {
                fontSize: '12px',
                lineHeight: '1.5',
              },
            }}
            value={form.values.guarantors[index].address}
            onChange={(event) =>
              form.setFieldValue(
                `guarantors.${index}.address`,
                capitalizeInputFormField(event.currentTarget.value)
              )
            }
            minRows={2}
            maxRows={4}
            autosize
          />
        </div>
      </div>
      <ActionIcon
        color="red"
        className="mt-4"
        onClick={() => {
          const removedGuarantor = form.values.guarantors[index];

          // Remove the guarantor
          form.removeListItem('guarantors', index);

          // If the guarantor came from a director, uncheck alsoGuarantor
          if (removedGuarantor.source?.startsWith('director-')) {
            const directorIndex = parseInt(
              removedGuarantor.source.split('-')[1],
              10
            );
            form.setFieldValue(
              `directors.${directorIndex}.alsoGuarantor`,
              false
            );
          }
        }}
      >
        <IconTrash size="1rem" />
      </ActionIcon>
    </div>
  ));

  // Validate the form to ensure at least one director is authorise signatory
  const checkHasAuthorisedSignatory = (directors: Director[]) => {
    const hasAuthoriseSignatory = directors.some(
      (director) => director.authoriseSignatory === true
    );

    // Throw error if no authorise signatory at all in the directors form
    if (!hasAuthoriseSignatory) {
      throw new Error('At least one director must be an Authorised Signatory');
    }
  };

  const onSubmitForm = async (values: {
    personInCharge: PersonInCharge;
    directors: Director[];
    shareholders: Shareholder[];
    guarantors: Guarantors[];
  }) => {
    console.log('🚀 ~ onSubmitForm ~ values:', values);

    try {
      const apiRequestBody = {
        directors: values.directors.map((d) => ({
          person: {
            name: d.name,
            residentialAddress: d.address,
            identificationNumber: d.identificationNumber,
            mobileNumber: d.contactNumber,
            email: d.emailAddress,
          },
          organizationPerson: {
            designation: d.designation,
          },
          authoriseSignatory: d.authoriseSignatory,
        })),
        shareholders: values.shareholders.map((d) => ({
          person: {
            name: d.name,
            residentialAddress: d.address,
            identificationNumber: d.identificationNumber,
            mobileNumber: d.contactNumber,
            email: d.emailAddress,
          },
          organizationPerson: {
            designation: d.designation,
          },
          shareholdingPercentage: d.shareholdingPercentage,
        })),
        guarantors: values.guarantors.map((g) => ({
          person: {
            name: g.name,
            residentialAddress: g.address,
            identificationNumber: g.identificationNumber,
            mobileNumber: g.contactNumber,
            email: g.emailAddress,
          },
          organizationPerson: {
            designation: g.designation,
          },
          relationshipToApplicant: g.relationshipToApplicant,
        })),
      };

      const storeRepDetailsResponse = await axios.post(
        `${BASE_URL}/risk-operation/api/applications/${applicationId}/representative`,
        JSON.stringify(apiRequestBody),
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(
        '🎉 ~ Store Represntative Details API response:',
        storeRepDetailsResponse
      );

      if (storeRepDetailsResponse.status === 200) {
        const submitForReviewResponse = await axios.post(
          `${BASE_URL}/risk-operation/api/applications/${applicationId}/submit`,
          JSON.stringify(apiRequestBody),
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        console.log(
          '🎉 ~ Submit Application For Review API response:',
          submitForReviewResponse
        );

        if (submitForReviewResponse.status === 200) {
          // Redirected to the next steps once successfully stored data into database
          updateOnboardAtMutation.mutate(
            { onboardAt: 'Completed' },
            {
              onSuccess: () => {
                setNextActiveSteps();

                notifications.show({
                  title: 'Success',
                  message: 'Your data has been successfully stored',
                  color: 'green',
                  autoClose: 2000,
                });
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
            }
          );
        }
      }
    } catch (error: any) {
      close();

      console.error('Error processing form data:', error.message);
      notifications.show({
        title: 'Error',
        message: 'Failed to process form data',
        color: 'red',
        autoClose: 2000,
      });
    }
  };

  return (
    <form onSubmit={form.onSubmit(onSubmitForm)}>
      <div className="mt-7 mr-7 ml-7 px-5 flex flex-col items-center">
        <div className="border-2 border-zinc-200 p-2.5 mt-2.5 mb-2.5 rounded">
          <IconUsers
            style={{ width: '20px', height: '20px', color: 'black' }}
          />
        </div>
        <div className="font-bold">Representative Details</div>
        <div className="text-zinc-400 text-xs">
          Provide your representative's information.
        </div>
        <div className="flex flex-col w-full">
          <div className="border-2 border-zinc-200 flex flex-col rounded-md p-7 mt-5">
            <h1 className="text-xs mb-2 font-semibold">*Person In-Charge</h1>
            {personInChargeField()}
          </div>
          <div className="border-2 border-zinc-200 flex flex-col rounded-md p-7 mt-8">
            <h1 className="text-xs mb-2 font-semibold">*Directors</h1>
            {directorFields}
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <Button
                  onClick={() =>
                    form.insertListItem('directors', {
                      name: '',
                      identificationNumber: '',
                      designation: '',
                      address: '',
                      contactNumber: '',
                      emailAddress: '',
                      authoriseSignatory: null,
                      key: randomId(),
                    })
                  }
                  variant="primary"
                  className="w-full md:w-auto"
                  style={{
                    color: '#ffffff',
                    backgroundColor: color.GOLD,
                    marginTop: '30px',
                  }}
                  leftSection={<IconPlus size={14} />}
                >
                  Add Director
                </Button>
              </div>
            </div>
          </div>
          <div className="border-2 border-zinc-200 flex flex-col rounded-md p-6 mt-8">
            <h1 className="text-xs mb-2 font-semibold">*Shareholders</h1>
            {shareholderFields}
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <Button
                  onClick={() =>
                    form.insertListItem('shareholders', {
                      name: '',
                      identificationNumber: '',
                      designation: '',
                      address: '',
                      contactNumber: '',
                      emailAddress: '',
                      shareholdingPercentage: 0,
                      key: randomId(),
                    })
                  }
                  variant="primary"
                  className="w-full md:w-auto"
                  style={{
                    color: '#ffffff',
                    backgroundColor: color.GOLD,
                    marginTop: '30px',
                  }}
                  leftSection={<IconPlus size={14} />}
                >
                  Add Shareholder
                </Button>
              </div>
            </div>
          </div>
          <div className="border-2 border-zinc-200 flex flex-col rounded-md p-6 mt-8">
            <h1 className="text-xs mb-2 font-semibold">Guarantors</h1>
            {guarantorFields}
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <Button
                  onClick={() =>
                    form.insertListItem('guarantors', {
                      name: '',
                      identificationNumber: '',
                      designation: '',
                      address: '',
                      contactNumber: '',
                      emailAddress: '',
                      relationshipToApplicant: '',
                      key: randomId(),
                    })
                  }
                  variant="primary"
                  className="w-full md:w-auto"
                  style={{
                    color: '#ffffff',
                    backgroundColor: color.GOLD,
                    marginTop: '30px',
                  }}
                  leftSection={<IconPlus size={14} />}
                >
                  Add Guarantor
                </Button>
              </div>
            </div>
          </div>
          <div className="flex self-end mt-5 mb-9">
            <Button
              variant="primary"
              className="w-full md:w-auto"
              style={{
                color: '#ffffff',
                backgroundColor: color.GOLD,
                marginTop: '30px',
              }}
              onClick={() => {
                try {
                  // Check if there is an authorised signatory
                  checkHasAuthorisedSignatory(form.values.directors);

                  if (form.validate().hasErrors) {
                    notifications.show({
                      title: 'Error',
                      message: 'Please correct the highlighted fields',
                      color: 'red',
                      autoClose: 5000,
                    });
                    return;
                  }
                  // If check passes, proceed to open modal
                  open();
                } catch (error: any) {
                  // Show notification if no authorised signatory
                  notifications.show({
                    title: 'Error',
                    message: error.message || 'Failed to process form data',
                    color: 'red',
                    autoClose: 5000,
                  });
                }
              }}
            >
              Save & continue
            </Button>
          </div>
        </div>
      </div>
      <Modal
        opened={opened}
        onClose={close}
        title="Are you sure you want to proceed?"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        centered
        className="flex"
      >
        <div className="text-sm font-light mb-6 text-justify">
          <p>
            Please make sure your details are correct. We’ll send an email to
            your authorise signatory to complete verification, and this step
            can’t be undone.
          </p>
        </div>
        <div className="flex flex-col justify-end md:flex-row gap-4">
          <Button
            variant="outline"
            color={color.GOLD}
            className="w-full md:w-auto bg-[#B0A275] text-white"
            onClick={close}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="w-full md:w-auto bg-[#B0A275] text-white"
            style={{
              color: '#ffffff',
              backgroundColor: color.GOLD,
            }}
            onClick={() => form.onSubmit(onSubmitForm)()} // this is custom triggering, extra pair of parentheses at the end is a must due to form.onSubmit(onSubmitForm) returns a function, so must invoke the function to submit form
          >
            Proceed
          </Button>
        </div>
      </Modal>
    </form>
  );
};

export default ClientOnboardingRepresentativeDetailsForm;
