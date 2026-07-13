import {
  ActionIcon,
  Card,
  Checkbox,
  Divider,
  NumberInput,
  RangeSlider,
  Select,
  TextInput,
  Tooltip,
  Text,
} from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { IconInfoCircle, IconPlus } from '@tabler/icons-react';
import Header from 'components/SQF/BaseComponents/Header';
import React, { useEffect, useState } from 'react';
import { createNewRiskFactor } from '../Forms/InitialValues';

interface EvaluationParametersProps {
  form: UseFormReturnType<createNewRiskFactor>;
  sub?: string;
  index?: number;
}

const EvaluationParameters: React.FC<EvaluationParametersProps> = ({
  form,
  sub,
  index,
}) => {
  const [evaluationParams, setEvaluationParams] = useState<any>([]);
  const [subEvaluationParams, setSubEvaluationParams] = useState<any>([]);
  const [sliderValue, setSliderValue] = useState<[number, number]>([0, 10]);
  const [isRequireSubEvaluationParam, setIsRequireSubEvaluationParam] =
    useState(false); // checkbox
  const [scoreTypeValue, setScoreTypeValue] = useState<string | null>('');
  const [listPath, setListPath] = useState<string>('evaluationParameters');
  const [subListPath, setSubListPath] = useState<string>('subEvaluationParams');

  useEffect(() => {
    if (sub) {
      setListPath(`${sub}.${index}.evaluationParameters`);
    }
  }, []);

  const onNewEvaluationParamClick = () => {
    const newEvaluationParam = {
      value: (evaluationParams.length + 1).toString(),
      name: '',
      description: '',
      weight: null,
      scoreType: null,
      riskCategory: null,
      subEvaluationParams: [],
      isRequireSubEvaluationParam: false,
    };

    form.insertListItem(listPath, newEvaluationParam);

    setEvaluationParams((prevFactors: any) => [
      ...prevFactors,
      newEvaluationParam,
    ]);
  };

  const onNewSubEvaluationParamClick = () => {
    const newSubEvaluationParam = {
      name: '',
      scoreType: 'FIXED',
      fixedScore: 0,
      scoreRangeMin: undefined,
      scoreRangeMax: undefined,
    };

    form.insertListItem(subListPath, newSubEvaluationParam);

    setSubEvaluationParams((prevFactors: any) => [
      ...prevFactors,
      newSubEvaluationParam,
    ]);
  };

  const updateSliderValue = (value: [number, number], index: number) => {
    form.setFieldValue(`${listPath}.${index}.scoreRangeMin`, value[0]);
    form.setFieldValue(`${listPath}.${index}.scoreRangeMax`, value[1]);
  };

  const updateIsRequireSubEvaluationParam = (
    event: any,
    evaluationParamIndex: number
  ) => {
    setIsRequireSubEvaluationParam(event.currentTarget.checked);

    let subEvaPath = 'subEvaluationParams';
    if (sub) {
      subEvaPath = `${listPath}.${evaluationParamIndex}.subEvaluationParams`;
    }

    if (event.currentTarget.checked) {
      const subEvaParam = {
        name: '',
        scoreType: 'FIXED',
        fixedScore: 0,
        scoreRangeMin: undefined,
        scoreRangeMax: undefined,
      };
      form.insertListItem(subEvaPath, subEvaParam);
      form.setFieldValue(
        `${listPath}.${evaluationParamIndex}.isRequireSubEvaluationParam`,
        true
      );

      setSubListPath(`${listPath}.${evaluationParamIndex}.subEvaluationParams`);
    } else {
      form.setFieldValue(
        `${listPath}.${evaluationParamIndex}.isRequireSubEvaluationParam`,
        false
      );

      form.removeListItem(subEvaPath, 0);
      setSubListPath('subEvaluationParams');
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <Header
          title="Evaluation Parameters"
          description="Add details to guide how this risk factor will be evaluated by assigning weights, choose classifications, and set a fixed or range-based score."
        />

        <div>
          <ActionIcon variant="primary" onClick={onNewEvaluationParamClick}>
            <IconPlus size={16} />
          </ActionIcon>
        </div>
      </div>
      {evaluationParams.map((item: any, evaParamIndex: number) => (
        <Card
          key={evaParamIndex}
          mt={20}
          withBorder
          radius="md"
          styles={() => ({
            root: {
              backgroundColor: '#FAFAFA', // Use Mantine's theme colors
            },
          })}
        >
          <Text fw={700}>#{evaParamIndex + 1}</Text>
          <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <TextInput
                label="Name"
                withAsterisk
                required
                {...form.getInputProps(`${listPath}.${evaParamIndex}.name`)}
              />
            </div>
            <div className="sm:col-span-3">
              <TextInput
                label="Description"
                {...form.getInputProps(
                  `${listPath}.${evaParamIndex}.description`
                )}
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
                suffix="%"
                decimalScale={2}
                allowNegative={false}
                allowDecimal={false}
                thousandSeparator=","
                className="flex-1"
                max={100}
                min={0}
                {...form.getInputProps(`${listPath}.${evaParamIndex}.weight`)}
                onChange={(val) =>
                  form.setFieldValue(
                    `${listPath}.${evaParamIndex}.weight`,
                    val === '' ? null : val
                  )
                }
              />
            </div>
            <div className="sm:col-span-3">
              <Select
                label="Risk Classification"
                data={['LOW', 'MEDIUM', 'HIGH']}
                {...form.getInputProps(
                  `${listPath}.${evaParamIndex}.riskCategory`
                )}
              />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <Select
                withAsterisk
                label="Score Type"
                data={['RANGE', 'FIXED']}
                // value={item.scoreTypeValue}
                // onChange={setScoreTypeValue}
                {...form.getInputProps(
                  `${listPath}.${evaParamIndex}.scoreType`
                )}
              />
            </div>
            {form.getInputProps(`${listPath}.${evaParamIndex}.scoreType`)
              .value !== null &&
              form.getInputProps(`${listPath}.${evaParamIndex}.scoreType`)
                .value === 'FIXED' && (
                <div className="sm:col-span-3">
                  <NumberInput
                    label="Score"
                    {...form.getInputProps(
                      `${listPath}.${evaParamIndex}.fixedScore`
                    )}
                  />
                </div>
              )}
            {form.getInputProps(`${listPath}.${evaParamIndex}.scoreType`)
              .value !== null &&
              form.getInputProps(`${listPath}.${evaParamIndex}.scoreType`)
                .value === 'RANGE' && (
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
                    onChangeEnd={(value) =>
                      updateSliderValue(value, evaParamIndex)
                    }
                  />
                </div>
              )}
          </div>
          {form.getInputProps(`${listPath}.${evaParamIndex}.scoreType`) &&
            form.getInputProps(`${listPath}.${evaParamIndex}.scoreType`)
              .value === 'RANGE' && (
              <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                <div className="sm:col-span-3 flex gap-1">
                  <Checkbox
                    label="Require Sub-Evaluation Parameter"
                    size="xs"
                    style={{ fontWeight: 250 }}
                    checked={
                      form.getInputProps(
                        `${listPath}.${evaParamIndex}.isRequireSubEvaluationParam`
                      ).value
                    }
                    onChange={(event) =>
                      updateIsRequireSubEvaluationParam(event, evaParamIndex)
                    }
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
            )}
          {form.getInputProps(
            `${listPath}.${evaParamIndex}.isRequireSubEvaluationParam`
          ).value === true && (
            <>
              <Divider my="md" />
              <div className="flex justify-between items-center mb-3">
                <Header
                  title="Sub-Evaluation Parameter Configuration"
                  description="Add and configure sub-level parameters to refine the evaluation process further."
                />

                <div>
                  <ActionIcon
                    variant="primary"
                    onClick={onNewSubEvaluationParamClick}
                  >
                    <IconPlus size={16} />
                  </ActionIcon>
                </div>
              </div>
              {form.getInputProps(
                `${listPath}.${evaParamIndex}.subEvaluationParams`
              ).value.length > 0 && (
                <Card withBorder>
                  {form
                    .getInputProps(
                      `${listPath}.${evaParamIndex}.subEvaluationParams`
                    )
                    .value.map((item: any, subIndex: number) => (
                      <div
                        key={subIndex}
                        className="mt-4 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6"
                      >
                        <div className="sm:col-span-3">
                          <TextInput
                            label="Name"
                            withAsterisk
                            required
                            {...form.getInputProps(
                              `${subListPath}.${subIndex}.name`
                            )}
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <NumberInput
                            styles={{
                              label: { fontWeight: 250 },
                            }}
                            label="Score"
                            size="xs"
                            withAsterisk
                            required
                            decimalScale={2}
                            allowNegative={false}
                            allowDecimal={false}
                            thousandSeparator=","
                            className="flex-1"
                            max={100}
                            min={0}
                            {...form.getInputProps(
                              `${subListPath}.${subIndex}.fixedScore`
                            )}
                          />
                        </div>
                      </div>
                    ))}
                </Card>
              )}
            </>
          )}
        </Card>
      ))}
    </>
  );
};

export default EvaluationParameters;
