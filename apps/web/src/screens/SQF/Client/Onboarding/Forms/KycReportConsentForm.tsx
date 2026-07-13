import React, { useState } from 'react';
import { Button, Checkbox, LoadingOverlay } from '@mantine/core';
import { IconReport } from '@tabler/icons-react';
import ExperianLogo from 'assets/img/experianlogo.png';
import TextInput from 'components/TextBox/TextBox';
import { notifications } from '@mantine/notifications';
import {
  kycReportConsentDetails,
  kycReportConsentFormInitialValues,
} from 'screens/SQF/Client/Onboarding/Forms/Components/InitialValues';
import { useForm, zodResolver } from '@mantine/form';
import { kycReportConsentValidator } from 'screens/SQF/Client/Onboarding/Forms/Components/FormValidation';
import { useDisclosure } from '@mantine/hooks';
import { color } from 'constants/color';

interface Props {
  setNextActiveSteps: () => void;
}

const ClientOnboardingKycReportConsentForm: React.FC<Props> = ({
  setNextActiveSteps,
}) => {
  const form = useForm<kycReportConsentDetails>({
    initialValues: kycReportConsentFormInitialValues,
    validateInputOnChange: true,
    validate: zodResolver(kycReportConsentValidator),
  });
  const [visible, { toggle }] = useDisclosure(false); // State for loader, calling toggle will switch the visible state from true to false or from false to true

  const onSubmitForm = async (values: kycReportConsentDetails) => {
    console.log('🚀 ~ onSubmitForm ~ values:', values);

    try {
      // Set toggle to TRUE, show the loader upon form submit
      toggle();

      // TODO: Store values to backend, do API calling

      // Simulate an API call, 1 sec to mimic delay
      // Code waits for the timeout to complete before proceeding to the next step
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Proceed with the next steps if validation passes
      setNextActiveSteps();

      // notifications.show({
      //   title: 'Success',
      //   message: 'Your credit report has been retrieved successfully!',
      //   color: 'green',
      //   autoClose: 5000,
      // });
    } catch (error) {
      console.error('Error fetching form data:', error);
      notifications.show({
        title: 'Error',
        message: 'Unable to retrieve the credit report',
        color: 'red',
        autoClose: 5000,
      });

      toggle();

      // throw error;
    } finally {
      // Set toggle to FALSE, hide the loader after the process is completed
      toggle();
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

  return (
    <div>
      <LoadingOverlay
        visible={visible}
        zIndex={1000}
        overlayProps={{ radius: 'sm', blur: 2 }}
        loaderProps={{ color: color.GOLD }}
      />
      <form
        onSubmit={form.onSubmit((values) => {
          console.log(values), onSubmitForm(values);
        })}
      >
        <div className="mt-7 mr-7 ml-7 px-5 flex flex-col items-center">
          <div className="border-2 border-zinc-200 p-2.5 mt-2.5 mb-2.5 rounded">
            <IconReport
              style={{ width: '20px', height: '20px', color: 'black' }}
            />
          </div>
          <div className="font-bold">Consent to Business Credit Check</div>
          <div className="text-zinc-400 text-xs text-center leading-relaxed">
            I hereby consent to [Your Company] obtaining my company’s credit
            report from Experian and CTOS under <br /> the CRA Act 2010 and PDPA
            2010.
          </div>
          <div className="flex flex-col">
            <div className="border-2 border-zinc-200 flex flex-col rounded-md pt-2.5 mt-5">
              <img
                src={ExperianLogo}
                alt="experian-logo"
                className="w-20 mt-2 self-center"
              />
              <div className="text-xs p-5 text-justify">
                <p className="pb-3">
                  Pursuant to the Credit Reporting Agencies (CRA) Act 2010 and
                  Central Bank of Malaysia Act 2009, I/we the undersigned do
                  hereby give my/our consent to you, CTOS Data Systems Sdn Bhd
                  (“CTOS”) and Experian Information Services (Malaysia) Sdn Bhd
                  (“Experian”), registered credit reporting agencies under the
                  CRA Act to process my/our company personal data. By this
                  consent, I/we understand and agree that:
                </p>

                <ol className="list-decimal list-inside">
                  <li className="pb-3">
                    You may conduct credit/trade check including CCRIS checks on
                    me/us and when consent has been given individually, on our
                    directors, shareholders, guarantors, etc. with CTOS and
                    Experian at any time for as long as I/we have a trade
                    relationship with you or where any dues remain unpaid and
                    outstanding with you, for any one or more of the following
                    purposes:
                    <div>√ Opening of account</div>
                    <div>√ Debt recovery</div>
                    <div>√ Credit/Account review</div>
                    <div>√ Credit/Account monitoring</div>
                    <div>√ Credit/Account evaluation</div>
                    <div>
                      √ Legal documentation consequent to a contract or facility
                      granted by you
                    </div>
                  </li>
                  <li className="pb-3">
                    You may disclose any information on my/our conduct of my/our
                    account(s) with you, to any business entity/ies for bona
                    fide trade checking at any time. I/We am/are also aware and
                    understand that such information will be provided to CTOS
                    and Experian, who may in turn share such information to
                    subscribers of their service.
                  </li>
                  <li className="pb-3">
                    Where you require any processing of my/our application to be
                    processed by any processing centre located outside Malaysia
                    (including your Head Office), I/we hereby give consent to
                    CTOS and Experian to disclose my/our credit information
                    except CCRIS, to such locations outside Malaysia.
                  </li>
                  <li className="">
                    Apart from the above, I/we the undersigned do give my/our
                    consent to you, CTOS and Experian, to process my/our
                    personal data as per the PDPA Act.
                  </li>
                </ol>
              </div>
            </div>
            <div className="mt-7 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-8">
              <div className="sm:col-span-3">
                <TextInput
                  label="Email"
                  error={form.errors.emailAddress}
                  withAsterisk
                  required
                  {...form.getInputProps('emailAddress')}
                />
              </div>

              <div className="sm:col-span-3">
                <TextInput
                  label="Contact Number"
                  error={form.errors.contactNumber}
                  withAsterisk
                  required
                  {...form.getInputProps('contactNumber')}
                />
              </div>
              <div className="col-span-full">
                <Checkbox
                  label="Please provide your consent before proceeding"
                  size="xs"
                  error={form.errors.consentAcknowledgement}
                  styles={{ label: { fontWeight: 250 } }}
                  color={color.GOLD}
                  {...form.getInputProps('consentAcknowledgement')}
                  required
                />
              </div>
            </div>
            <div className="flex self-center px-7">
              <Button
                variant="primary"
                className="w-full md:w-auto"
                style={{
                  color: '#ffffff',
                  backgroundColor: color.GOLD,
                  marginTop: '30px',
                }}
                type="submit"
                disabled={visible}
                onClick={checkFormErrors}
              >
                {visible ? 'Loading...' : 'Request Credit Report'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ClientOnboardingKycReportConsentForm;
