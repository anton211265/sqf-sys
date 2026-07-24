import * as React from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from 'components/ui/button';
import { Card } from 'components/ui/card';
import { Input } from 'components/ui/input';
import { Label } from 'components/ui/label';
import { PUBLIC } from 'constants/routes';
import { useRegister } from 'hooks/usePortal';
import { getApiResponseErrorMsg } from 'utils/apiHelper';

/** Company email capture + account creation (enrollment link is emailed). */
const Register: React.FC = () => {
  const navigate = useNavigate();
  const registerMutation = useRegister();
  const [email, setEmail] = React.useState('');
  const [contactName, setContactName] = React.useState('');
  const [companyName, setCompanyName] = React.useState('');
  const [registrationNumber, setRegistrationNumber] = React.useState('');
  const [country, setCountry] = React.useState('MY');
  const [error, setError] = React.useState<string | null>(null);

  const acceptance = React.useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('sqf-portal-acceptance') ?? 'null');
    } catch {
      return null;
    }
  }, []);

  React.useEffect(() => {
    if (!acceptance?.acceptedTerms || !acceptance?.acceptedPrivacy) {
      navigate(PUBLIC.DISCLAIMER, { replace: true });
    }
  }, [acceptance, navigate]);

  const submit = async () => {
    setError(null);
    try {
      await registerMutation.mutateAsync({
        email: email.trim(),
        contactName: contactName.trim(),
        companyName: companyName.trim(),
        businessRegistrationNumber: registrationNumber.trim() || undefined,
        country: country.trim().toUpperCase(),
        disclaimerCode: acceptance.disclaimerCode,
        disclaimerHash: acceptance.disclaimerHash,
        acceptedTerms: true,
        acceptedPrivacy: true,
      });
      sessionStorage.removeItem('sqf-portal-acceptance');
      navigate(PUBLIC.REGISTERED);
    } catch (e) {
      setError(getApiResponseErrorMsg(e));
    }
  };

  const valid =
    email.includes('@') && contactName.trim().length >= 2 && companyName.trim().length >= 2 && country.trim().length === 2;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-lg p-6">
        <h1 className="text-xl font-semibold">Create your application account</h1>
        <p className="mb-4 text-sm text-muted-foreground">
          Use your <strong>company email address</strong> — personal email providers are not
          accepted. A secure passkey setup link will be emailed to you (valid 24 hours).
        </p>
        <div className="space-y-3">
          <div>
            <Label htmlFor="reg-email">Company email</Label>
            <Input id="reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="reg-contact">Your full name</Label>
            <Input id="reg-contact" value={contactName} onChange={(e) => setContactName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="reg-company">Registered company name</Label>
            <Input id="reg-company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="reg-brn">Business registration no. (optional)</Label>
              <Input id="reg-brn" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="reg-country">Registered country (ISO-2)</Label>
              <Input id="reg-country" maxLength={2} value={country} onChange={(e) => setCountry(e.target.value.toUpperCase())} />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => navigate(PUBLIC.DISCLAIMER)}>Back</Button>
            <Button disabled={!valid || registerMutation.isPending} onClick={submit}>
              Create account
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Register;
