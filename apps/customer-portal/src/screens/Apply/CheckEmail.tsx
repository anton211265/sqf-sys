import * as React from 'react';
import { Link } from 'react-router-dom';

import { Card } from 'components/ui/card';
import { AUTH } from 'constants/routes';

const CheckEmail: React.FC = () => (
  <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
    <Card className="w-full max-w-md p-6 text-center">
      <h1 className="text-xl font-semibold">Check your email</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We&apos;ve sent a secure setup link to your company email. Open it on this
        device to register your passkey and access the application workspace.
        The link is valid for 24 hours and can be used once.
      </p>
      <p className="mt-4 text-sm">
        Already set up?{' '}
        <Link className="text-primary hover:underline" to={AUTH.LOGIN}>
          Sign in
        </Link>
      </p>
    </Card>
  </div>
);

export default CheckEmail;
