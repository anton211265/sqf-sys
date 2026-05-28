import { ValueTransformer } from 'typeorm';

export const rangeTransformer: ValueTransformer = {
  to: (value: [number, number]) => {
    return `[${value[0]}, ${value[1]}]`;
  },
  from: (value: string) => {
    const match = value.match(/\[(.+),(.+)]/);
    return match ? [parseFloat(match[1]), parseFloat(match[2])] : null;
  },
};
