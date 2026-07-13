import {
  Accordion,
  ActionIcon,
  Button,
  Checkbox,
  Divider,
  Group,
  Modal,
  NumberInput,
  RangeSlider,
  Select,
  Switch,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import TextInput from 'components/TextBox/TextBox';
import Header from 'components/SQF/BaseComponents/Header';
import { color } from 'constants/color';
import React, { FC, useState } from 'react';
import { IconInfoCircle, IconPlus } from '@tabler/icons-react';
import { riskScoreMethod } from 'constants/riskScoreMethod';
import EvaluationParameters from './ConfigurationSection/EvaluationParameters';
import SubFactors from './ConfigurationSection/SubFactors';
import axios from 'axios';
import { BASE_URL } from 'constants/constant';
import { useForm, zodResolver } from '@mantine/form';
import {
  createNewRiskFactor,
  createNewRiskFactorInitialValues,
} from './Forms/InitialValues';
import { createNewRiskFactorValidator } from './Forms/FormValidation';

interface RiskConfigurationProps {
  closeWithRefetch: (requiredRefetch: boolean) => void;
  riskModelId?: string; // Optional string prop
}

const RiskConfiguration: FC<RiskConfigurationProps> = ({
  riskModelId,
  closeWithRefetch,
}) => {
  const [opened, { open, close }] = useDisclosure(false); // modal

  const [isDisplayAsTab, setIsDisplayAsTab] = useState(true); // checkbox
  const [sliderValue, setSliderValue] = useState<[number, number]>([0, 10]);
  const [subFactors, setSubFactors] = useState<any>([]);

  const form = useForm<createNewRiskFactor>({
    initialValues: createNewRiskFactorInitialValues,
    // validateInputOnChange: true,
    validate: zodResolver(createNewRiskFactorValidator),
  });

  const onCancelModal = () => {
    close();
    closeWithRefetch(false);
    form.reset();
  };

  const onSaveModal = (values: createNewRiskFactor) => {
    try {
      axios
        .post(
          `${BASE_URL}/risk-operation/api/risk-factor/${riskModelId}`,
          values,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
        .then((resp) => {
          form.reset();
          close();
          closeWithRefetch(true);
        });
    } catch (error) {
      console.log(error);
    }
  };

  const onNewSubFactorClick = () => {
    const newFactor = {
      value: (subFactors.length + 1).toString(),
      riskFactorName: '',
      description: '',
      isSetAsCategory: false,
      hasSubFactor: false,
      evaluationParameters: [],
      subFactors: [],
    };
    form.insertListItem('subFactors', newFactor);

    setSubFactors((prevFactors: any) => [...prevFactors, newFactor]);
  };

  const updateSliderValue = (value: [number, number]) => {
    setSliderValue(value);
    form.setFieldValue('scoreRangeMin', value[0]);
    form.setFieldValue('scoreRangeMax', value[1]);
  };

  const setIsCategoryChecked = (event: any) => {
    form.setFieldValue('isSetAsCategory', event.currentTarget.checked);
    setIsDisplayAsTab(true);
  };

  return (
    <>
      <div className="m-3">
        <Button
          variant="primary"
          className="w-full md:w-auto"
          style={{
            color: '#ffffff',
            backgroundColor: color.GRAPE,
          }}
          onClick={open}
        >
          Add New Risk Factor
        </Button>
      </div>
      <div>
        <Modal
          opened={opened}
          onClose={close}
          centered
          closeOnClickOutside={false}
          withCloseButton={false}
          size="60rem"
          styles={{
            content: {
              padding: '15px',
            },
          }}
        >
          {/* Add New Risk Factor Section  */}
          <div className="flex justify-between">
            <Header
              title="Add New Risk Factor"
              description="Add and configure risk factors for this model to assess risks in applicant profiles."
            />
            <div>
              <Button
                variant="primary"
                className="w-full md:w-auto"
                onClick={onNewSubFactorClick}
                disabled={!form.getValues().isSetAsCategory}
              >
                Add New Sub-factor
              </Button>
            </div>
          </div>
          <form onSubmit={form.onSubmit(onSaveModal)}>
            <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <TextInput
                  label="Name"
                  withAsterisk
                  required
                  {...form.getInputProps('riskFactorName')}
                />
              </div>
              <div className="sm:col-span-3">
                <TextInput
                  label="Description"
                  {...form.getInputProps('description')}
                />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <NumberInput
                  styles={{
                    label: { fontWeight: 250 },
                  }}
                  label="Weight (%)"
                  size="xs"
                  withAsterisk
                  required
                  suffix="%"
                  decimalScale={2}
                  allowNegative={false}
                  allowDecimal={false}
                  thousandSeparator=","
                  className="flex-1"
                  max={100}
                  min={0}
                  {...form.getInputProps('weight')}
                />
              </div>
              <div className="sm:col-span-3">
                <label
                  className="block text-xs mb-2.5 mt-1"
                  style={{ fontWeight: 250 }}
                >
                  Set as Category <span className="text-red-500">*</span>
                </label>
                <Switch
                  checked={form.getValues().isSetAsCategory}
                  onChange={setIsCategoryChecked}
                  // {...form.getInputProps('isSetAsCategory', {
                  //   type: 'checkbox',
                  // })}
                  defaultChecked
                />
              </div>
            </div>
            {form.getValues().isSetAsCategory && (
              <>
                <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                  <div className="sm:col-span-3 flex gap-1">
                    <Checkbox
                      label="Display as a Tab"
                      size="xs"
                      style={{ fontWeight: 250 }}
                      checked={isDisplayAsTab}
                      onChange={(event) =>
                        setIsDisplayAsTab(event.currentTarget.checked)
                      }
                      disabled
                    />
                    <Tooltip
                      label="Show this risk factor as a separate tab in the interface"
                      styles={{
                        tooltip: {
                          fontSize: '12px',
                          maxWidth: '200px', // Set maximum width for tooltip content
                          whiteSpace: 'normal', // Allows text to wrap within the tooltip
                        },
                      }}
                    >
                      <IconInfoCircle size={16} color="#6B7280" />
                    </Tooltip>
                  </div>
                </div>
                {isDisplayAsTab && (
                  <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <TextInput
                        label="Tab Name"
                        withAsterisk
                        required
                        {...form.getInputProps('tabName')}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Score Settings Section  */}
            {!form.getValues().isSetAsCategory && (
              <>
                <div>
                  <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label
                        className="block text-xs mb-1 mt-1"
                        style={{ fontWeight: 250 }}
                      >
                        Score Range <span className="text-red-500">*</span>
                      </label>
                      <RangeSlider
                        marks={[
                          { value: 0, label: '0' },
                          { value: 5, label: '5' },
                          { value: 10, label: '10' },
                          { value: 15, label: '15' },
                          { value: 20, label: '20' },
                        ]}
                        label={(value) => `${value}`}
                        // Set the initial value of the slider without controlling it fully
                        // Allows the slider to manage its own state while dragging
                        defaultValue={sliderValue}
                        max={20}
                        styles={{
                          markLabel: {
                            fontSize: '12px',
                          },
                        }}
                        minRange={0}
                        // if use value and onChange, small movement of slider can trigger a state update causing a jerky and unresponsive when sliding the thumbs
                        // use onChangeEnd bcos it fires only once when the user finishes dragging the slider and releases it.
                        // This allows the slider to move freely during the drag without triggering state updates or re-renders.
                        // Only after the user stops sliding does onChangeEnd update the state, allowing us to capture the final value without interrupting the smooth interaction.
                        // Display range as {sliderValue[0]} - {sliderValue[1]}
                        onChangeEnd={(value) => updateSliderValue(value)}
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <Select
                        clearable
                        size="xs"
                        label="Score Method"
                        placeholder="Select Score Method"
                        data={riskScoreMethod.map((company) => ({
                          label: company.name,
                          value: company.code,
                        }))}
                        withAsterisk
                        searchable
                        styles={{
                          label: { fontWeight: 250 },
                        }}
                        {...form.getInputProps('scoreMethod')}
                      />
                    </div>
                  </div>
                  {(form.getInputProps(`scoreMethod`).value ===
                    'LABEL_SELECTION' ||
                    form.getInputProps(`scoreMethod`).value ===
                      'DROPDOWN_SELECTION') && (
                    <>
                      <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                        <div className="sm:col-span-3 flex gap-1">
                          <Checkbox
                            label="Require Evaluation Parameter"
                            size="xs"
                            style={{ fontWeight: 250 }}
                            {...form.getInputProps(
                              'isRequireEvaluationParameter'
                            )}
                            // checked={isRequireEvaluationParam}
                            // onChange={(event) =>
                            //   setIsRequireEvaluationParam(
                            //     event.currentTarget.checked
                            //   )
                            // }
                          />
                          <Tooltip
                            label="Allows selection from predefined options for scoring this risk factor"
                            styles={{
                              tooltip: {
                                fontSize: '12px',
                                maxWidth: '200px', // Set maximum width for tooltip content
                                whiteSpace: 'normal', // Allows text to wrap within the tooltip
                              },
                            }}
                          >
                            <IconInfoCircle size={16} color="#6B7280" />
                          </Tooltip>
                        </div>
                      </div>
                      {form.getInputProps('isRequireEvaluationParameter')
                        .value && (
                        <>
                          <Divider my="md" />
                          <EvaluationParameters form={form} />
                        </>
                      )}
                    </>
                  )}
                </div>
              </>
            )}

            {form.getValues().isSetAsCategory &&
              form.getValues().subFactors &&
              (form.getValues().subFactors as createNewRiskFactor[]).length >
                0 && (
                <>
                  <Divider my="md" />
                  <SubFactors
                    subFactorsList={
                      form.getValues().subFactors as createNewRiskFactor[]
                    }
                    form={form}
                  />
                </>
              )}

            <div className="flex justify-end">
              <Group mt="lg">
                <Button
                  onClick={onCancelModal}
                  variant="outline"
                  color="myColor"
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save changes
                </Button>
              </Group>
            </div>
          </form>
        </Modal>
      </div>
    </>
  );
};

export default RiskConfiguration;
