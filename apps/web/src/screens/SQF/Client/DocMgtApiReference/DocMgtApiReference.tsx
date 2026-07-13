import { BASE_URL } from 'constants/constant';
import React, { FC } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import styles from './DocMgtApiReference.module.css';

const DocMgtApiReference: FC = () => {
  return (
    <div className={styles.wrapper}>
      <SwaggerUI
        url={`${BASE_URL}/document-management/api-json`}
        deepLinking={true}
        supportedSubmitMethods={[]}
      />
    </div>
  );
};

export default DocMgtApiReference;
