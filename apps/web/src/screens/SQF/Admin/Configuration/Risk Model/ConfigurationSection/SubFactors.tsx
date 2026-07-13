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
import Header from 'components/SQF/BaseComponents/Header';
import React, { useMemo, useState } from 'react';
import classes from './SubFactors.module.css';

import {
  MantineReactTable,
  MRT_ColumnDef,
  MRT_TableOptions,
} from 'mantine-react-table';
import EvaluationParameters from './EvaluationParameters';
import { createNewRiskFactor } from '../Forms/InitialValues';
import { UseFormReturnType } from '@mantine/form';
import SubFactorItem from './SubFactorItem';

interface SubFactorsProps {
  form: UseFormReturnType<createNewRiskFactor>;
  subFactorsList: createNewRiskFactor[];
}

const SubFactors: React.FC<SubFactorsProps> = ({ subFactorsList, form }) => {
  const [isCategoryEnabled, setIsCategoryEnabled] = useState(false); // switch
  const [isSecondaryCategoryEnabled, setIsSecondaryCategoryEnabled] =
    useState(false); // switch

  const [selectedScoreMethod, setSelectedScoreMethod] = useState<string | null>(
    ''
  );

  const [highRiskDefaultValue, setHighRiskDefaultValue] = useState<number>();
  const [isRequireEvaluationParam, setIsRequireEvaluationParam] =
    useState(false); // checkbox

  const [path, setPath] = useState<string>('subFactors');
  const [pathIndex, setPathIndex] = useState<string>('1');

  const onAccordionChange = (value: string | null) => {
    // setPath(`subFactors`);
    // setPathIndex(value as string);

    console.log(value);

    console.log('form', form);

    console.log('subFactorsList ', subFactorsList);
  };

  return (
    <>
      <div className="mb-3">
        <Header
          title="Sub-factor"
          description="Add and configure sub-factors under this risk factor to provide a more detailed assessment"
        />
      </div>

      <Accordion
        variant="contained"
        defaultValue="1"
        classNames={classes}
        onChange={onAccordionChange}
      >
        {subFactorsList.map((item: any, index) => (
          <Accordion.Item key={item.value} value={item.value}>
            <Accordion.Control>Sub-factor</Accordion.Control>
            <Accordion.Panel>
              <SubFactorItem
                form={form}
                index={index}
                // subFactor={item}
                // path={path}
                pathIndex={item.value}
              />
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </>
  );
};

export default SubFactors;
