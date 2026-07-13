export const getRiskCategoryColor = (riskCategory: string) => {
  let color = '';
  switch (riskCategory) {
    case 'LOW':
      color = 'bg-[#34c759]';
      break;
    case 'MEDIUM':
      color = 'bg-[#ffb300]';
      break;
    case 'HIGH':
      color = 'bg-[#b3271e]';
      break;
  }

  return color;
};
