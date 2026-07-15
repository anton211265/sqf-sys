import axiosClient from 'api/axiosClient';
import { getApiResponseErrorMsg } from 'utils/apiHelper';
import { UserType } from 'types/UserType';

const getLogInPersonDetail = async (): Promise<UserType> => {
  try {
    const response = await axiosClient().get('/trade-directory/api/person/me');
    return response.data;
  } catch (e) {
    throw new Error(getApiResponseErrorMsg(e));
  }
};

export default getLogInPersonDetail;
