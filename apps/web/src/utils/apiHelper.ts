import axios from 'axios';

export const getApiResponseErrorMsg = (e: any): string => {
  let message = 'Something went wrong, please try again later.';

  if (axios.isAxiosError(e) && e.response) {
    message = `${
      e.response?.data?.message || e.response?.statusText || message
    }`;
  } else if (e instanceof Error) {
    message = e.message;
  }

  return message;
};
