import { getApiResponseErrorMsg } from 'utils/apiHelper';
import { publicClient } from 'utils/reactQuery';

interface IGetOrgsByEmailRequest {
  email: string;
}

export interface IGetOrgsByEmailResponse {
  id: number;
  name: string;
}

const getOrgsByEmail = async ({
  email,
}: IGetOrgsByEmailRequest): Promise<IGetOrgsByEmailResponse[]> => {
  try {
    const response = await publicClient.post(
      '/trade-directory/auth/organizations',
      {
        email,
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    return response.data.organizations;
  } catch (e) {
    const message = getApiResponseErrorMsg(e);

    throw new Error(message);
  }
};

export default getOrgsByEmail;
