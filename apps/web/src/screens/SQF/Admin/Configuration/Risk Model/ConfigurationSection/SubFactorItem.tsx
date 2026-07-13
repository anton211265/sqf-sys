import {
  Accordion,
  ActionIcon,
  Divider,
  NumberInput,
  RangeSlider,
  Select,
  Switch,
  TextInput,
  Text,
  Button,
  Flex,
  Checkbox,
  Tooltip,
  Card,
  Paper,
  SimpleGrid,
} from '@mantine/core';
import React, { useMemo, useState } from 'react';
import {
  MantineReactTable,
  MRT_ColumnDef,
  MRT_TableOptions,
} from 'mantine-react-table';
import { UseFormReturnType } from '@mantine/form';
import { color } from 'constants/color';
import { countries } from 'constants/countries';
import { riskScoreMethod } from 'constants/riskScoreMethod';
import { IconInfoCircle, IconPlus } from '@tabler/icons-react';
import EvaluationParameters from './EvaluationParameters';
import { createNewRiskFactor } from '../Forms/InitialValues';
import classes from './SubFactors.module.css';
import Header from 'components/SQF/BaseComponents/Header';

interface SubFactorItemProps {
  form: UseFormReturnType<createNewRiskFactor>;
  index: number;
  pathIndex: string;
}

const SubFactorItem: React.FC<SubFactorItemProps> = ({
  form,
  index,
  pathIndex,
}) => {
  const [path, setPath] = useState<string>('subFactors');

  const [highRiskCountriesData, setHighRiskCountriesData] = useState<any[]>([]);
  const [mediumRiskCountriesData, setMediumRiskCountriesData] = useState<any[]>(
    []
  );
  const [lowRiskCountriesData, setLowRiskCountriesData] = useState<any[]>([]);

  const [sliderValue, setSliderValue] = useState<[number, number]>([0, 10]);

  const columns: MRT_ColumnDef<any>[] = useMemo(
    () => [
      {
        accessorKey: 'countryName',
        header: 'Country Name',
        mantineTableHeadCellProps: {
          style: {
            textTransform: 'uppercase', // Converts header text to lowercase
            fontSize: '13px',
            color: color.DARKGREY,
          },
        },
        filterVariant: 'select', // Use a dropdown for filtering
        mantineFilterSelectProps: {
          data: countries.map((country) => country.name), // Options for the dropdown
          placeholder: 'Search by Country', // Custom placeholder
        },
        enableHiding: false,
        editVariant: 'select',
        mantineEditSelectProps: {
          data: countries.map((country) => country.name),
        },

        Cell: ({ cell }) => (
          <span className="capitalize">
            {cell.getValue<string>().toLowerCase()}
          </span>
        ),
      },
      {
        accessorKey: 'riskCategory',
        header: 'Risk Category',
        mantineTableHeadCellProps: {
          style: {
            textTransform: 'uppercase', // Converts header text to lowercase
            fontSize: '13px',
            color: color.DARKGREY,
          },
        },

        filterVariant: 'select', // Use a dropdown for filtering
        mantineFilterSelectProps: {
          data: ['Low', 'Medium', 'High'], // Options for the dropdown
          placeholder: 'Search by Category', // Custom placeholder
        },
        enableHiding: false,
        enableSorting: false,
        editVariant: 'select',
        mantineEditSelectProps: {
          data: ['Low', 'Medium', 'High'],
        },
        Cell: ({ row }) => {
          if (row.original.riskCategory === 'Low') {
            return (
              <div className="flex items-center gap-2">
                <div className={`${classes.lowRisk} ${classes.ellipse}`}></div>
                {row.original.riskCategory}
              </div>
            );
          }
          if (row.original.riskCategory === 'Medium') {
            return (
              <div className="flex items-center gap-2">
                <div
                  className={`${classes.mediumRisk} ${classes.ellipse}`}
                ></div>
                {row.original.riskCategory}
              </div>
            );
          }
          if (row.original.riskCategory === 'High') {
            return (
              <div className="flex items-center gap-2">
                <div className={`${classes.highRisk} ${classes.ellipse}`}></div>
                {row.original.riskCategory}
              </div>
            );
          }
          return <span>-</span>;
        },
      },
      {
        accessorKey: 'score',
        header: 'Score',
        mantineTableHeadCellProps: {
          style: {
            textTransform: 'uppercase', // Converts header text to lowercase
            fontSize: '13px',
            color: color.DARKGREY,
          },
        },
        mantineEditTextInputProps: {
          type: 'number',
          required: true,
        },
        // Cell: ({ row }) => {
        //   if (row.original.riskModelStatus === 'PUBLISHED') {
        //     return <span>{row.original.numberOfActiveProfiles}</span>;
        //   }
        //   return <span>-</span>;
        // },
      },
    ],
    []
  );

  const addNewCountries = ({ table }: any) => {
    return (
      <Button
        onClick={() => {
          table.setCreatingRow(true); //simplest way to open the create row modal with no default values
          //or you can pass in a row object to set default values with the `createRow` helper function
          // table.setCreatingRow(
          //   createRow(table, {
          //     //optionally pass in default values for the new row, useful for nested data or other complex scenarios
          //   }),
          // );
        }}
      >
        Add Country
      </Button>
    );
  };

  const handleCreateHighRiskCountries: MRT_TableOptions<any>['onCreatingRowSave'] =
    async ({ values, exitCreatingMode }) => {
      await createHighRiskCountries(values);
      exitCreatingMode();
    };

  const createHighRiskCountries = (data: any) => {
    setHighRiskCountriesData((prevData) => [...prevData, data]);

    const currIndex = Number(pathIndex) - 1;
    if (form.getInputProps(`${path}.${currIndex}.countryList`).value == null) {
      const payLoad = {
        highRisk: [],
        mediumRisk: [],
        lowRisk: [],
      };

      form.setFieldValue(`${path}.${currIndex}.countryList`, payLoad);
    }

    switch (data.riskCategory) {
      case 'High':
        form.setFieldValue(`${path}.${currIndex}.countryList.highRisk`, [
          ...form.getInputProps(`${path}.${currIndex}.countryList.highRisk`)
            .value,
          { countryName: data.countryName, score: Number(data.score) },
        ]);
        break;
      case 'Medium':
        form.setFieldValue(`${path}.${currIndex}.countryList.mediumRisk`, [
          ...form.getInputProps(`${path}.${currIndex}.countryList.mediumRisk`)
            .value,
          { countryName: data.countryName, score: Number(data.score) },
        ]);
        break;
      case 'Low':
        form.setFieldValue(`${path}.${currIndex}.countryList.lowRisk`, [
          ...form.getInputProps(`${path}.${currIndex}.countryList.lowRisk`)
            .value,
          { countryName: data.countryName, score: Number(data.score) },
        ]);
        break;
    }
  };

  //UPDATE action
  const handleSaveHighRiskCountries: MRT_TableOptions<any>['onEditingRowSave'] =
    async ({ values, table }) => {
      // const newValidationErrors = validateUser(values);
      // if (Object.values(newValidationErrors).some((error) => error)) {
      //   setValidationErrors(newValidationErrors);
      //   return;
      // }
      // setValidationErrors({});
      await updateHighRiskCountries(values);
      table.setEditingRow(null); //exit editing mode
    };

  const updateHighRiskCountries = (data: any) => {
    const currIndex = Number(pathIndex) - 1;

    switch (data.riskCategory) {
      case 'High': {
        const highRiskCountries = form.getInputProps(
          `${path}.${currIndex}.countryList.highRisk`
        ).value;
        const updatedHighRiskCountries = highRiskCountries.map(
          (country: any) =>
            country.countryName === data.countryName
              ? { ...country, score: Number(data.score) }
              : country
        );
        form.setFieldValue(
          `${path}.${currIndex}.countryList.highRisk`,
          updatedHighRiskCountries
        );
        break;
      }
      case 'Medium': {
        const mediumRiskCountries = form.getInputProps(
          `${path}.${currIndex}.countryList.mediumRisk`
        ).value;
        const updatedMediumRiskCountries = mediumRiskCountries.map(
          (country: any) =>
            country.countryName === data.countryName
              ? { ...country, score: Number(data.score) }
              : country
        );
        form.setFieldValue(
          `${path}.${currIndex}.countryList.mediumRisk`,
          updatedMediumRiskCountries
        );
        break;
      }
      case 'Low': {
        const lowRiskCountries = form.getInputProps(
          `${path}.${currIndex}.countryList.lowRisk`
        ).value;
        const updatedLowRiskCountries = lowRiskCountries.map((country: any) =>
          country.countryName === data.countryName
            ? { ...country, score: Number(data.score) }
            : country
        );
        form.setFieldValue(
          `${path}.${currIndex}.countryList.lowRisk`,
          updatedLowRiskCountries
        );
        break;
      }
    }
  };

  const updateSliderValue = (
    value: [number, number],
    index: number,
    subFactorIndex: number
  ) => {
    if (
      (form.getValues().subFactors as createNewRiskFactor[])[index]
        .isSetAsCategory === true
    ) {
      form.setFieldValue(
        `subFactors.${index}.subFactors.${subFactorIndex}.scoreRangeMin`,
        value[0]
      );
      form.setFieldValue(
        `subFactors.${index}.subFactors.${subFactorIndex}.scoreRangeMax`,
        value[1]
      );
    } else {
      form.setFieldValue(`subFactors.${index}.scoreRangeMin`, value[0]);
      form.setFieldValue(`subFactors.${index}.scoreRangeMax`, value[1]);
    }
  };

  const setIsCategoryChecked = (event: any, index: number) => {
    form.setFieldValue(
      `subFactors.${index}.isSetAsCategory`,
      event.currentTarget.checked
    );

    form.setFieldValue(
      `subFactors.${index}.hasSubFactor`,
      event.currentTarget.checked
    );

    if (event.currentTarget.checked) {
      const newFactor = {
        riskFactorName: '',
        description: undefined,
        isSetAsCategory: false,
        hasSubFactor: false,
        evaluationParameters: [],
        scoreRangeMin: null,
        scoreRangeMax: null,
        isRequireEvaluationParameter: false,
        countryList: null,
      };
      form.insertListItem(`subFactors.${index}.subFactors`, newFactor);
      setPath(`subFactors.${index}.subFactors`);
    } else {
      form.removeListItem(`subFactors.${index}.subFactors`, 0);
      setPath(`subFactors`);
    }
  };

  const onAddSubFactorClick = (subFactorIndex: number) => {
    const newFactor = {
      riskFactorName: '',
      description: undefined,
      isSetAsCategory: false,
      hasSubFactor: false,
      evaluationParameters: [],
      scoreRangeMin: null,
      scoreRangeMax: null,
      isRequireEvaluationParameter: false,
      countryList: null,
    };
    form.insertListItem(`subFactors.${subFactorIndex}.subFactors`, newFactor);
    console.log('add', form);
  };

  const updateIsRequireEvaluationParam = (event: any, fieldPath: string) => {
    if (event.currentTarget.checked) {
      form.setFieldValue(`${fieldPath}.isRequireEvaluationParameter`, true);
    } else {
      form.setFieldValue(`${fieldPath}.isRequireEvaluationParameter`, false);

      form.setFieldValue(`${fieldPath}.evaluationParameters`, []);
    }
  };

  return (
    <div>
      <Text fw={700}>Primary Sub-factor</Text>
      <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
        <div className="sm:col-span-3">
          <TextInput
            label="Name"
            withAsterisk
            required
            {...form.getInputProps(`subFactors.${index}.riskFactorName`)}
          />
        </div>
        <div className="sm:col-span-3">
          <TextInput
            label="Description"
            {...form.getInputProps(`subFactors.${index}.description`)}
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
            {...form.getInputProps(`subFactors.${index}.weight`)}
            onChange={(val) =>
              form.setFieldValue(
                `subFactors.${index}.weight`,
                val === '' ? null : val
              )
            }
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
            checked={
              (form.getValues().subFactors as createNewRiskFactor[])[index]
                .isSetAsCategory
            }
            onChange={(event) => setIsCategoryChecked(event, index)}
            //   {...form.getInputProps(`subFactors.${index}.isSetAsCategory`, {
            //   type: 'checkbox',
            // })}
            defaultChecked
          />
        </div>
      </div>

      {!(form.getValues().subFactors as createNewRiskFactor[])[index]
        .isSetAsCategory && (
        <>
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
                onChangeEnd={(value) => updateSliderValue(value, index, 0)}
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
                // value={selectedScoreMethod}
                // onChange={setSelectedScoreMethod}
                {...form.getInputProps(`subFactors.${index}.scoreMethod`)}
              />
            </div>
          </div>

          {((form.getValues().subFactors as createNewRiskFactor[])[index]
            .scoreMethod === 'LABEL_SELECTION' ||
            (form.getValues().subFactors as createNewRiskFactor[])[index]
              .scoreMethod === 'DROPDOWN_SELECTION') && (
            <>
              <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                <div className="sm:col-span-3 flex gap-1">
                  <Checkbox
                    label="Require Evaluation Parameter"
                    size="xs"
                    style={{ fontWeight: 250 }}
                    checked={
                      form.getInputProps(
                        `subFactors.${index}.isRequireEvaluationParameter`
                      ).value
                    }
                    onChange={(event) =>
                      updateIsRequireEvaluationParam(
                        event,
                        `subFactors.${index}`
                      )
                    }
                    // {...form.getInputProps(
                    //   `subFactors.${index}.isRequireEvaluationParameter`
                    // )}
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
              {(form.getValues().subFactors as createNewRiskFactor[])[index]
                .isRequireEvaluationParameter && (
                <>
                  <Divider my="md" />
                  <EvaluationParameters
                    form={form}
                    sub={path}
                    index={form.getInputProps(`${path}`).value.length - 1}
                  />
                </>
              )}
            </>
          )}

          {(form.getValues().subFactors as createNewRiskFactor[])[index]
            .scoreMethod === 'COUNTRY_SELECTION' && (
            <>
              <Divider my="md" />
              <Header
                title="Country List"
                description="Review the list of countries and make any necessary adjustments to the list and scoring."
              />

              <SimpleGrid cols={3} my={20}>
                <Paper shadow="xs" radius="md" withBorder p="md">
                  <div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`${classes.highRisk} ${classes.ellipse}`}
                      ></div>
                      <Text size="sm" fw={700}>
                        High-Risk Countries
                      </Text>
                    </div>
                    <Text size="sm">
                      Countries classified as high risk due to factors like
                      political instability, economic uncertainty, or stringent
                      trade policies.
                    </Text>
                  </div>
                </Paper>
                <Paper shadow="xs" radius="md" withBorder p="md">
                  <div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`${classes.mediumRisk} ${classes.ellipse}`}
                      ></div>
                      <Text size="sm" fw={700}>
                        Medium-Risk Countries
                      </Text>
                    </div>
                    <Text size="sm">
                      Countries with moderate risk levels that have a mix of
                      stable and fluctuating conditions affecting operations.
                    </Text>
                  </div>
                </Paper>
                <Paper shadow="xs" radius="md" withBorder p="md">
                  <div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`${classes.lowRisk} ${classes.ellipse}`}
                      ></div>
                      <Text size="sm" fw={700}>
                        Low-Risk Countries
                      </Text>
                    </div>

                    <Text size="sm">
                      Countries considered low risk, typically stable in terms
                      of political, economic, and regulatory environments.
                    </Text>
                  </div>
                </Paper>
              </SimpleGrid>

              <div className="my-5">
                <Text my={15} size="xs" fw={300}>
                  You can edit both the risk score and the risk category inline.
                  Simply select the desired risk category to make changes.
                </Text>

                <MantineReactTable
                  data={highRiskCountriesData}
                  columns={columns}
                  enableEditing={true}
                  positionActionsColumn="last"
                  createDisplayMode="row" // ('modal', and 'custom' are also available)
                  editDisplayMode="row" // ('modal', 'cell', 'table', and 'custom' are also available)
                  renderTopToolbarCustomActions={addNewCountries}
                  onCreatingRowSave={handleCreateHighRiskCountries}
                  onEditingRowSave={handleSaveHighRiskCountries}
                />
              </div>
            </>
          )}
        </>
      )}

      {(form.getValues().subFactors as createNewRiskFactor[])[index]
        .isSetAsCategory && (
        <>
          <div className="flex justify-between">
            <Text mt={20} fw={700}>
              Secondary Sub-factor
            </Text>

            <div>
              <Button
                variant="primary"
                className="w-full md:w-auto"
                onClick={() => onAddSubFactorClick(index)}
              >
                Add Sub-factor
              </Button>
            </div>
          </div>

          {form
            .getInputProps(`${path}`)
            .value.map((subFactorItem: any, subFactorIndex: number) => (
              <Card key={subFactorIndex} mt={20} withBorder radius="md">
                <div>
                  #{subFactorIndex + 1} Secondary Sub-factor
                  <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <TextInput
                        label="Name"
                        withAsterisk
                        required
                        {...form.getInputProps(
                          `${path}.${subFactorIndex}.riskFactorName`
                        )}
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <TextInput
                        label="Description"
                        {...form.getInputProps(
                          `${path}.${subFactorIndex}.description`
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
                        {...form.getInputProps(
                          `${path}.${subFactorIndex}.weight`
                        )}
                        onChange={(val) =>
                          form.setFieldValue(
                            `${path}.${subFactorIndex}.weight`,
                            val === '' ? null : val
                          )
                        }
                      />
                    </div>
                  </div>
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
                        onChangeEnd={(value) =>
                          updateSliderValue(value, index, subFactorIndex)
                        }
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
                        // value={selectedScoreMethod}
                        // onChange={setSelectedScoreMethod}
                        {...form.getInputProps(
                          `${path}.${subFactorIndex}.scoreMethod`
                        )}
                      />
                    </div>
                  </div>
                </div>

                {(form.getInputProps(`${path}.${subFactorIndex}.scoreMethod`)
                  .value === 'LABEL_SELECTION' ||
                  form.getInputProps(`${path}.${subFactorIndex}.scoreMethod`)
                    .value === 'DROPDOWN_SELECTION') && (
                  <>
                    <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                      <div className="sm:col-span-3 flex gap-1">
                        <Checkbox
                          label="Require Evaluation Parameter"
                          size="xs"
                          style={{ fontWeight: 250 }}
                          checked={
                            form.getInputProps(
                              `${path}.${subFactorIndex}.isRequireEvaluationParameter`
                            ).value
                          }
                          onChange={(event) =>
                            updateIsRequireEvaluationParam(
                              event,
                              `${path}.${subFactorIndex}`
                            )
                          }
                          // {...form.getInputProps(
                          //   `subFactors.${index}.isRequireEvaluationParameter`
                          // )}
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
                    {form.getInputProps(
                      `${path}.${subFactorIndex}.isRequireEvaluationParameter`
                    ).value && (
                      <>
                        <Divider my="md" />
                        <EvaluationParameters
                          form={form}
                          sub={path}
                          index={subFactorIndex}
                        />
                      </>
                    )}
                  </>
                )}

                {form.getInputProps(`${path}.${subFactorIndex}.scoreMethod`)
                  .value === 'COUNTRY_SELECTION' && (
                  <>
                    <Divider my="md" />
                    <Header
                      title="Country List"
                      description="Review the list of countries and make any necessary adjustments to the list and scoring."
                    />

                    <Accordion variant="contained" className="my-5">
                      <Accordion.Item value="item-1">
                        <Accordion.Control>
                          <div className="flex items-center gap-2">
                            <div
                              className={`${classes.highRisk} ${classes.ellipse}`}
                            ></div>
                            <Header
                              title="High-Risk Countries"
                              description="Countries classified as high risk due to factors like political instability, economic uncertainty, or stringent trade policies."
                            />
                          </div>
                        </Accordion.Control>
                        <Accordion.Panel>
                          {/* <Header
                                    title="Set Default Score"
                                    description="Assign a default score for all high-risk countries."
                                  />
                                  <Flex gap={10} mt={15}>
                                    <NumberInput value={highRiskDefaultValue} />
                                    <Button variant="primary">Apply</Button>
                                  </Flex>

                                  <Divider my="md" /> */}
                          <Text my={15} size="xs" fw={300}>
                            You can edit both the risk score and the risk
                            category inline. Simply select the desired risk
                            category to make changes.
                          </Text>

                          <MantineReactTable
                            data={highRiskCountriesData}
                            columns={columns}
                            renderTopToolbarCustomActions={addNewCountries}
                          />
                        </Accordion.Panel>
                      </Accordion.Item>

                      <Accordion.Item value="item-2">
                        <Accordion.Control>
                          <div className="flex items-center gap-2">
                            <div
                              className={`${classes.mediumRisk} ${classes.ellipse}`}
                            ></div>
                            <Header
                              title="Medium-Risk Countries"
                              description="Countries with moderate risk levels that have a mix of stable and fluctuating conditions affecting operations."
                            />
                          </div>
                        </Accordion.Control>
                        <Accordion.Panel>
                          {/* <Header
                                    title="Set Default Score"
                                    description="Assign a default score for all medium-risk countries."
                                  />
                                  <Flex gap={10} mt={15}>
                                    <NumberInput value={highRiskDefaultValue} />
                                    <Button variant="primary">Apply</Button>
                                  </Flex>

                                  <Divider my="md" /> */}
                          <Text my={15} size="xs" fw={300}>
                            You can edit both the risk score and the risk
                            category inline. Simply select the desired risk
                            category to make changes.
                          </Text>

                          <MantineReactTable
                            data={mediumRiskCountriesData}
                            columns={columns}
                          />
                        </Accordion.Panel>
                      </Accordion.Item>

                      <Accordion.Item value="item-3">
                        <Accordion.Control>
                          <div className="flex items-center gap-2">
                            <div
                              className={`${classes.lowRisk} ${classes.ellipse}`}
                            ></div>
                            <Header
                              title="Low-Risk Countries"
                              description="Countries considered low risk, typically stable in terms of political, economic, and regulatory environments."
                            />
                          </div>
                        </Accordion.Control>
                        <Accordion.Panel>
                          {/* <Header
                                    title="Set Default Score"
                                    description="Assign a default score for all low-risk countries."
                                  />
                                  <Flex gap={10} mt={15}>
                                    <NumberInput value={highRiskDefaultValue} />
                                    <Button variant="primary">Apply</Button>
                                  </Flex>

                                  <Divider my="md" /> */}
                          <Text my={15} size="xs" fw={300}>
                            You can edit both the risk score and the risk
                            category inline. Simply select the desired risk
                            category to make changes.
                          </Text>
                          <MantineReactTable
                            data={lowRiskCountriesData}
                            columns={columns}
                          />
                        </Accordion.Panel>
                      </Accordion.Item>
                    </Accordion>
                  </>
                )}
              </Card>
            ))}
        </>
      )}
    </div>
  );
};

export default SubFactorItem;
