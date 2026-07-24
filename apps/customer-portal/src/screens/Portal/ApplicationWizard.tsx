import * as React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { Button } from 'components/ui/button';
import { Card } from 'components/ui/card';
import { Input } from 'components/ui/input';
import { Label } from 'components/ui/label';
import { PORTAL } from 'constants/routes';
import {
  useApplication,
  useOnboardingConfig,
  useSaveApplication,
  useSubmitApplication,
} from 'hooks/usePortal';
import { RootState } from 'redux/store';
import { uploadDocument } from 'service/portal';
import {
  ApplicationPayload,
  PRODUCT_FORM_FIELDS,
  REQUIRED_DOCUMENT_CLASSES,
  UploadedDoc,
} from 'types/PortalTypes';
import { getApiResponseErrorMsg } from 'utils/apiHelper';

const STEPS = [
  'Company profile',
  'Product',
  'Application form',
  'KYC documents',
  'Bank account',
  'Directors & eResolution',
  'Review & submit',
];

const selectCls = 'h-9 w-full rounded-md border border-input bg-background px-3 text-sm';

function FileSlot({
  label,
  documentClass,
  orgId,
  docs,
  onUploaded,
  accept,
}: {
  label: string;
  documentClass: string;
  orgId: number;
  docs: UploadedDoc[];
  onUploaded: (documentClass: string, doc: UploadedDoc) => void;
  accept?: string;
}) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const uploaded = await uploadDocument(file, documentClass, orgId);
      onUploaded(documentClass, uploaded);
    } catch (e) {
      setError(getApiResponseErrorMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="rounded-md border border-dashed bg-background p-3"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        handleFile(e.dataTransfer.files?.[0]);
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{label}</p>
          {docs.length > 0 ? (
            <p className="text-xs text-emerald-700">
              ✓ {docs.map((d) => d.fileName).join(', ')}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Drag &amp; drop or browse (max 25MB)</p>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? 'Uploading…' : docs.length ? 'Replace / add' : 'Upload'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          hidden
          accept={accept}
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.currentTarget.value = '';
          }}
        />
      </div>
    </div>
  );
}

const ApplicationWizard: React.FC = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.user?.data);
  const orgId = user?.orgId as number;
  const { data: application, isLoading } = useApplication();
  const { data: config } = useOnboardingConfig();
  const saveApplication = useSaveApplication();
  const submitApplication = useSubmitApplication();

  const [step, setStep] = React.useState(0);
  const [payload, setPayload] = React.useState<ApplicationPayload>({});
  const [productCode, setProductCode] = React.useState<string>('');
  const [loadedFor, setLoadedFor] = React.useState<number | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (application && application.id !== loadedFor) {
      setPayload(JSON.parse(JSON.stringify(application.payload ?? {})));
      setProductCode(application.productCode ?? '');
      setLoadedFor(application.id);
    }
  }, [application, loadedFor]);

  React.useEffect(() => {
    if (application && application.status !== 'DRAFT') {
      navigate(PORTAL.STATUS, { replace: true });
    }
  }, [application, navigate]);

  if (isLoading || !application) {
    return <div className="p-6 text-sm text-muted-foreground">Loading application…</div>;
  }

  const patch = (section: keyof ApplicationPayload, value: any) =>
    setPayload((prev) => ({ ...prev, [section]: value }));

  const save = async (extra?: Record<string, any>) => {
    setNotice(null);
    setErrors([]);
    try {
      await saveApplication.mutateAsync({
        productCode: productCode || undefined,
        payload: { ...payload, ...(extra ?? {}) },
      });
      setNotice('Progress saved.');
    } catch (e) {
      setErrors([getApiResponseErrorMsg(e)]);
    }
  };

  const submit = async () => {
    setNotice(null);
    setErrors([]);
    try {
      await saveApplication.mutateAsync({ productCode: productCode || undefined, payload });
      await submitApplication.mutateAsync();
      navigate(PORTAL.STATUS);
    } catch (e: any) {
      const data = e?.response?.data;
      if (Array.isArray(data?.errors)) setErrors(data.errors);
      else setErrors([getApiResponseErrorMsg(e)]);
    }
  };

  const onDocUploaded = (documentClass: string, doc: UploadedDoc) => {
    setPayload((prev) => {
      const documents = { ...(prev.documents ?? {}) };
      documents[documentClass] = [...(documents[documentClass] ?? []), doc];
      const next = { ...prev, documents };
      // persist immediately so an interrupted session keeps the upload
      saveApplication.mutate({ payload: next });
      return next;
    });
  };

  const profile = payload.companyProfile ?? {};
  const form = payload.applicationForm ?? {};
  const bank = payload.bankAccount ?? {};
  const directors = payload.directors ?? [];
  const requiredDocs = REQUIRED_DOCUMENT_CLASSES[productCode] ?? [];
  const formFields = PRODUCT_FORM_FIELDS[productCode] ?? [];

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-[#0F172A] px-6 py-4 text-white">
        <div className="text-lg font-semibold">Financing Application</div>
        <div className="text-xs text-slate-300">{application.applicationNumber}</div>
      </header>
      <main className="mx-auto max-w-3xl p-6">
        {/* Step tracker */}
        <div className="mb-4 flex flex-wrap gap-1">
          {STEPS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(i)}
              className={`rounded-full px-3 py-1 text-xs ${
                i === step ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground border'
              }`}
            >
              {i + 1}. {label}
            </button>
          ))}
        </div>

        {notice && <p className="mb-2 rounded-md border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-800">{notice}</p>}
        {errors.length > 0 && (
          <div className="mb-2 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-800">
            {errors.map((e) => (<p key={e}>• {e}</p>))}
          </div>
        )}

        <Card className="space-y-3 p-6">
          {step === 0 && (
            <>
              <h2 className="font-medium">Company profile</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label>Registered company name</Label>
                  <Input value={profile.companyName ?? ''} onChange={(e) => patch('companyProfile', { ...profile, companyName: e.target.value })} />
                </div>
                <div>
                  <Label>Business registration number</Label>
                  <Input value={profile.businessRegistrationNumber ?? ''} onChange={(e) => patch('companyProfile', { ...profile, businessRegistrationNumber: e.target.value })} />
                </div>
                <div>
                  <Label>Registered country (ISO-2)</Label>
                  <Input maxLength={2} value={profile.country ?? ''} onChange={(e) => patch('companyProfile', { ...profile, country: e.target.value.toUpperCase() })} />
                </div>
                <div>
                  <Label>Contact email</Label>
                  <Input value={profile.contactEmail ?? user?.email ?? ''} onChange={(e) => patch('companyProfile', { ...profile, contactEmail: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <Label>Business address</Label>
                  <Input value={profile.address ?? ''} onChange={(e) => patch('companyProfile', { ...profile, address: e.target.value })} />
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <Label>Company directors (as registered)</Label>
                  <Button size="sm" variant="outline" onClick={() => patch('companyProfile', { ...profile, directors: [...(profile.directors ?? []), { name: '' }] })}>+ director</Button>
                </div>
                {(profile.directors ?? []).map((d, i) => (
                  <div key={i} className="mb-1 flex items-center gap-2">
                    <Input value={d.name} placeholder="Full legal name (as on passport)" onChange={(e) => {
                      const next = [...(profile.directors ?? [])];
                      next[i] = { name: e.target.value };
                      patch('companyProfile', { ...profile, directors: next });
                    }} />
                    <Button size="sm" variant="ghost" onClick={() => patch('companyProfile', { ...profile, directors: (profile.directors ?? []).filter((_, j) => j !== i) })}>✕</Button>
                  </div>
                ))}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="font-medium">Select a product</h2>
              <div className="grid gap-2 md:grid-cols-2">
                {(config?.activeProducts ?? []).map((p) => (
                  <button
                    key={p.productCode}
                    type="button"
                    onClick={() => setProductCode(p.productCode)}
                    className={`rounded-lg border p-4 text-left ${productCode === p.productCode ? 'border-primary ring-2 ring-primary/30' : 'bg-background'}`}
                  >
                    <div className="font-mono text-xs text-muted-foreground">{p.productCode}</div>
                    <div className="font-medium">{p.productName}</div>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-medium">Application form {productCode ? `(${productCode})` : ''}</h2>
              {!productCode && <p className="text-sm text-muted-foreground">Select a product first.</p>}
              <div className="grid gap-3 md:grid-cols-2">
                {formFields.map((field) => (
                  <div key={field.key}>
                    <Label>{field.label}</Label>
                    {field.type === 'select' ? (
                      <select className={selectCls} value={form[field.key] ?? ''} onChange={(e) => patch('applicationForm', { ...form, [field.key]: e.target.value })}>
                        <option value="">Select…</option>
                        {(field.options ?? []).map((o) => (<option key={o} value={o}>{o}</option>))}
                      </select>
                    ) : (
                      <Input
                        type={field.type}
                        value={form[field.key] ?? ''}
                        onChange={(e) => patch('applicationForm', { ...form, [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value })}
                      />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="font-medium">KYC documents</h2>
              {!productCode && <p className="text-sm text-muted-foreground">Select a product first — the required set depends on it.</p>}
              <p className="text-xs text-muted-foreground">
                PDF, CSV or Excel with a real text layer — scanned image files are not accepted
                for these classes.
              </p>
              <div className="space-y-2">
                {requiredDocs.map((doc) => (
                  <FileSlot
                    key={doc.class}
                    label={doc.label}
                    documentClass={doc.class}
                    orgId={orgId}
                    docs={payload.documents?.[doc.class] ?? []}
                    onUploaded={onDocUploaded}
                    accept=".pdf,.csv,.xlsx,.xls"
                  />
                ))}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="font-medium">Settlement bank account</h2>
              <p className="text-xs text-muted-foreground">
                The account must be held in your registered business country ({profile.country ?? '—'}).
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label>Beneficiary account name</Label>
                  <Input value={bank.beneficiaryName ?? ''} onChange={(e) => patch('bankAccount', { ...bank, beneficiaryName: e.target.value })} />
                </div>
                <div>
                  <Label>Bank name</Label>
                  <Input value={bank.bankName ?? ''} onChange={(e) => patch('bankAccount', { ...bank, bankName: e.target.value })} />
                </div>
                <div>
                  <Label>SWIFT / BIC</Label>
                  <Input value={bank.swift ?? ''} onChange={(e) => patch('bankAccount', { ...bank, swift: e.target.value.toUpperCase() })} />
                </div>
                <div>
                  <Label>IBAN (or domestic account number)</Label>
                  <Input value={bank.iban ?? ''} onChange={(e) => patch('bankAccount', { ...bank, iban: e.target.value.toUpperCase() })} />
                </div>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <h2 className="font-medium">Directors &amp; eResolution</h2>
              <p className="text-xs text-muted-foreground">
                Each signing director uploads their passport (JPEG/PNG/PDF). Companies with 2+
                directors must also upload the signed company resolution appointing the
                authorised signatory. Names must match the directors on your registration
                documents.
              </p>
              <div className="mb-2 flex items-center justify-between">
                <Label>Signing directors</Label>
                <Button size="sm" variant="outline" onClick={() => patch('directors', [...directors, { name: '' }])}>+ director</Button>
              </div>
              <div className="space-y-2">
                {directors.map((d, i) => (
                  <div key={i} className="rounded-md border bg-background p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <Input value={d.name} placeholder="Full legal name (as on passport)" onChange={(e) => {
                        const next = [...directors];
                        next[i] = { ...d, name: e.target.value };
                        patch('directors', next);
                      }} />
                      <Button size="sm" variant="ghost" onClick={() => patch('directors', directors.filter((_, j) => j !== i))}>✕</Button>
                    </div>
                    <FileSlot
                      label={d.passportFileName ? `Passport: ${d.passportFileName}` : 'Passport photo page'}
                      documentClass="DIRECTOR_IDENTIFICATION"
                      orgId={orgId}
                      docs={d.passportDocUuid ? [{ uuid: d.passportDocUuid, fileName: d.passportFileName ?? 'uploaded' }] : []}
                      accept=".pdf,.png,.jpg,.jpeg"
                      onUploaded={(_cls, doc) => {
                        const next = [...directors];
                        next[i] = { ...d, passportDocUuid: doc.uuid, passportFileName: doc.fileName };
                        setPayload((prev) => {
                          const merged = { ...prev, directors: next };
                          saveApplication.mutate({ payload: merged });
                          return merged;
                        });
                      }}
                    />
                  </div>
                ))}
              </div>
              {directors.length >= 2 && (
                <FileSlot
                  label={payload.eResolutionFileName ? `eResolution: ${payload.eResolutionFileName}` : 'Signed company resolution (eResolution)'}
                  documentClass="OTHER"
                  orgId={orgId}
                  docs={payload.eResolutionDocUuid ? [{ uuid: payload.eResolutionDocUuid, fileName: payload.eResolutionFileName ?? 'uploaded' }] : []}
                  accept=".pdf"
                  onUploaded={(_cls, doc) => {
                    setPayload((prev) => {
                      const merged = { ...prev, eResolutionDocUuid: doc.uuid, eResolutionFileName: doc.fileName };
                      saveApplication.mutate({ payload: merged });
                      return merged;
                    });
                  }}
                />
              )}
              <p className="rounded-md border border-dashed bg-muted/30 p-2 text-xs text-muted-foreground">
                Identity verification runs automatically after submission (development uses a
                mock verification provider; production uses a certified eKYC vendor with
                passive liveness detection).
              </p>
            </>
          )}

          {step === 6 && (
            <>
              <h2 className="font-medium">Review &amp; submit</h2>
              <ul className="space-y-1 text-sm">
                <li>Company: <strong>{profile.companyName ?? '—'}</strong> ({profile.country ?? '—'}, reg. {profile.businessRegistrationNumber ?? '—'})</li>
                <li>Product: <strong>{productCode || '—'}</strong></li>
                <li>Form fields completed: {Object.keys(form).length} / {formFields.length}</li>
                <li>
                  Documents: {requiredDocs.filter((d) => (payload.documents?.[d.class] ?? []).length > 0).length} / {requiredDocs.length} required classes uploaded
                </li>
                <li>Bank: {bank.beneficiaryName ? `${bank.beneficiaryName} (${bank.swift ?? '—'})` : '—'}</li>
                <li>Directors: {directors.length} {directors.length >= 2 ? (payload.eResolutionDocUuid ? '· eResolution uploaded' : '· eResolution MISSING') : ''}</li>
              </ul>
              <p className="text-xs text-muted-foreground">
                On submission your application is processed through the funder&apos;s default
                risk assessment. You&apos;ll receive an acknowledgment email and can track the
                status here.
              </p>
              <Button onClick={submit} disabled={submitApplication.isPending || saveApplication.isPending}>
                Submit application
              </Button>
            </>
          )}
        </Card>

        <div className="mt-3 flex justify-between">
          <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}>← Back</Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => save()} disabled={saveApplication.isPending}>Save progress</Button>
            {step < STEPS.length - 1 && (
              <Button onClick={() => { save(); setStep(step + 1); }}>Next →</Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ApplicationWizard;
