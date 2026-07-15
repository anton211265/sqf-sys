import axiosClient from 'api/axiosClient';
import { getApiResponseErrorMsg } from 'utils/apiHelper';

export interface IGetOrgsByEmailResponse {
  id: number;
  name: string;
}

const getOrgsByEmail = async ({
  email,
}: {
  email: string;
}): Promise<IGetOrgsByEmailResponse[]> => {
  try {
    const response = await axiosClient().post(
      '/trade-directory/auth/organizations',
      { email },
      { headers: { 'Content-Type': 'application/json' } },
    );
    return response.data.organizations;
  } catch (e) {
    throw new Error(getApiResponseErrorMsg(e));
  }
};

export default getOrgsByEmail;
