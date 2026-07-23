import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Upload } from 'lucide-react';

import { Badge } from 'components/ui/badge';
import { Button } from 'components/ui/button';
import { Checkbox } from 'components/ui/checkbox';
import { Dialog, DialogDescription, DialogFooter, DialogTitle } from 'components/ui/dialog';
import { Input } from 'components/ui/input';
import { Label } from 'components/ui/label';
import { Sheet } from 'components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'components/ui/table';
import {
  useAssignments,
  useBindTemplates,
  useConfigProducts,
  useCreateAssignment,
  useCreateDraft,
  useProductTemplates,
  usePublishRateCard,
  useRateCards,
  useTemplates,
  useUpdateDraft,
} from 'hooks/useConfigurator';
import { useHasPermission } from 'hooks/useRbac';
import { CONFIG } from 'constants/routes';
import { RateCard, fractionToPercent } from 'types/ConfiguratorTypes';
import { getApiResponseErrorMsg } from 'utils/apiHelper';
import { renderAssignment } from 'service/configurator';
import {
  RateCardForm,
  RateCardFormState,
  emptyRateCardForm,
  formToPayload,
  rateCardToForm,
} from './RateCardForm';

const statusVariant = (status: RateCard['status']) =>
  status === 'PUBLISHED' ? 'green' : status === 'DRAFT' ? 'amber' : 'default';

/**
 * Product detail (wireframe 6): master rate card versioning (draft → publish
 * → archive), legal template bindings (whole-set replace) and the
 * snapshotted assignment monitor with the Handlebars injection previewer.
 */
const ProductDetail: React.FC = () => {
  const { id } = useParams();
  const productId = parseInt(id ?? '', 10);
  const navigate = useNavigate();

  const { data: products = [] } = useConfigProducts();
  const product = products.find((p) => p.id === productId);
  const { data: rateCards = [] } = useRateCards(Number.isNaN(productId) ? null : productId);
  const { data: allTemplates = [] } = useTemplates();
  const { data: boundTemplates = [] } = useProductTemplates(
    Number.isNaN(productId) ? null : productId,
  );
  const { data: assignments = [] } = useAssignments();

  const hasPermission = useHasPermission();
  const canDraft = hasPermission('config_rate_cards_manage');
  const canPublish = hasPermission('config_rate_cards_publish');
  const canBind = hasPermission('config_legal_templates_manage');
  const canAssign = hasPermission('config_products_manage');

  const createDraft = useCreateDraft();
  const updateDraft = useUpdateDraft();
  const publish = usePublishRateCard();
  const bindTemplates = useBindTemplates();
  const createAssignment = useCreateAssignment();

  const [selectedCardId, setSelectedCardId] = React.useState<number | null>(null);
  const [form, setForm] = React.useState<RateCardFormState>(emptyRateCardForm);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [pendingBindings, setPendingBindings] = React.useState<Set<number>>(new Set());
  const [assignDialog, setAssignDialog] = React.useState(false);
  const [assignOrgId, setAssignOrgId] = React.useState('');
  const [preview, setPreview] = React.useState<{ title: string; text: string } | null>(null);

  const selectedCard =
    rateCards.find((c) => c.id === selectedCardId) ??
    rateCards.find((c) => c.status === 'PUBLISHED') ??
    rateCards[0];

  React.useEffect(() => {
    if (selectedCard) setForm(rateCardToForm(selectedCard));
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCard?.id, selectedCard?.status]);

  React.useEffect(() => {
    setPendingBindings(new Set(boundTemplates.map((t) => t.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boundTemplates.map((t) => t.id).join(',')]);

  const productAssignments = assignments.filter((a) => a.productId === productId);

  const handleNewDraft = async () => {
    setError(null);
    try {
      const base = rateCards[0] ? formToPayload(rateCardToForm(rateCards[0])) : {};
      const draft = await createDraft.mutateAsync({ productId, ...base });
      setSelectedCardId(draft.id);
      setNotice(`Draft v${draft.versionNumber} created from the latest version.`);
    } catch (e) {
      setError(getApiResponseErrorMsg(e));
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedCard) return;
    setError(null);
    setNotice(null);
    try {
      await updateDraft.mutateAsync({ id: selectedCard.id, ...formToPayload(form) });
      setNotice('Draft saved.');
    } catch (e) {
      setError(getApiResponseErrorMsg(e));
    }
  };

  const handlePublish = async () => {
    if (!selectedCard) return;
    setError(null);
    setNotice(null);
    try {
      await publish.mutateAsync(selectedCard.id);
      setNotice(
        `v${selectedCard.versionNumber} published — previous published version archived; existing assignments unchanged.`,
      );
    } catch (e) {
      setError(getApiResponseErrorMsg(e));
    }
  };

  const bindingsDirty =
    pendingBindings.size !== boundTemplates.length ||
    boundTemplates.some((t) => !pendingBindings.has(t.id));

  const handleSaveBindings = async () => {
    setError(null);
    try {
      await bindTemplates.mutateAsync({ productId, templateIds: [...pendingBindings] });
      setNotice('Legal template bindings saved.');
    } catch (e) {
      setError(getApiResponseErrorMsg(e));
    }
  };

  const handleAssign = async () => {
    setError(null);
    try {
      await createAssignment.mutateAsync({
        organizationId: parseInt(assignOrgId, 10),
        productId,
      });
      setAssignDialog(false);
      setAssignOrgId('');
    } catch (e) {
      setError(getApiResponseErrorMsg(e));
    }
  };

  const handlePreview = async (assignmentId: number, templateId: number) => {
    setError(null);
    try {
      const result = await renderAssignment(assignmentId, templateId);
      const template = allTemplates.find((t) => t.id === templateId);
      setPreview({
        title: `${template?.documentName ?? 'Template'} — assignment #${assignmentId}`,
        text: result.rendered,
      });
    } catch (e) {
      setError(getApiResponseErrorMsg(e));
    }
  };

  if (!product) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        {products.length === 0 ? 'Loading product…' : 'Product not found.'}
      </div>
    );
  }

  const isDraft = selectedCard?.status === 'DRAFT';

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate(CONFIG.PRODUCTS)}
            className="mb-1 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Product Registry
          </button>
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <span className="font-mono">{product.productCode}</span>
            {product.productName}
            {product.isCustomBespoke && (
              <Badge variant="purple">
                Bespoke · org #{product.clientOwnerOrganizationId}
              </Badge>
            )}
            <Badge variant={product.isActive ? 'green' : 'default'}>
              {product.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </h1>
        </div>
        {canAssign && (
          <Button onClick={() => setAssignDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Assign to Client
          </Button>
        )}
      </div>

      {(error || notice) && (
        <div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {notice && <p className="text-sm text-emerald-700">{notice}</p>}
        </div>
      )}

      {/* Master rate cards */}
      <section className="rounded-lg border bg-background p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium">Master Rate Card Versions</h2>
          {canDraft && (
            <Button variant="outline" size="sm" onClick={handleNewDraft} disabled={createDraft.isPending}>
              <Plus className="mr-2 h-3.5 w-3.5" /> New Draft Version
            </Button>
          )}
        </div>
        <div className="flex gap-4">
          <div className="w-56 shrink-0 space-y-1">
            {rateCards.length === 0 && (
              <p className="text-sm text-muted-foreground">No versions yet.</p>
            )}
            {rateCards.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => setSelectedCardId(card.id)}
                className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm ${
                  card.id === selectedCard?.id ? 'border-primary bg-muted' : 'hover:bg-muted/50'
                }`}
              >
                <span>v{card.versionNumber}</span>
                <Badge variant={statusVariant(card.status)}>{card.status}</Badge>
              </button>
            ))}
          </div>
          <div className="flex-1">
            {selectedCard ? (
              <>
                <RateCardForm value={form} onChange={setForm} disabled={!isDraft || !canDraft} />
                {!isDraft && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {selectedCard.status === 'PUBLISHED'
                      ? 'Published versions are immutable — create a new draft to change pricing.'
                      : 'Archived version (read-only).'}
                  </p>
                )}
                <div className="mt-3 flex justify-end gap-2">
                  {isDraft && canDraft && (
                    <Button variant="outline" onClick={handleSaveDraft} disabled={updateDraft.isPending}>
                      Save Draft
                    </Button>
                  )}
                  {isDraft && canPublish && (
                    <Button onClick={handlePublish} disabled={publish.isPending}>
                      Publish v{selectedCard.versionNumber}
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Create the first draft version to configure pricing.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Legal template bindings */}
      <section className="rounded-lg border bg-background p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium">Legal Document Templates</h2>
          {canBind && (
            <Button
              variant="outline"
              size="sm"
              disabled={!bindingsDirty || bindTemplates.isPending}
              onClick={handleSaveBindings}
            >
              Save Bindings
            </Button>
          )}
        </div>
        {allTemplates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No templates in the registry yet — add them under Legal Templates.
          </p>
        ) : (
          <div className="space-y-2">
            {allTemplates.map((template) => (
              <label key={template.id} className="flex cursor-pointer items-center gap-3">
                <Checkbox
                  aria-label={template.documentCode}
                  checked={pendingBindings.has(template.id)}
                  disabled={!canBind}
                  onCheckedChange={() => {
                    const next = new Set(pendingBindings);
                    if (next.has(template.id)) next.delete(template.id);
                    else next.add(template.id);
                    setPendingBindings(next);
                  }}
                />
                <span className="font-mono text-sm">{template.documentCode}</span>
                <span className="text-sm text-muted-foreground">{template.documentName}</span>
                {!template.templateBody && (
                  <Badge variant="outline">
                    <Upload className="mr-1 h-3 w-3" /> no inline body
                  </Badge>
                )}
              </label>
            ))}
          </div>
        )}
      </section>

      {/* Snapshotted assignments */}
      <section className="rounded-lg border bg-background p-4">
        <h2 className="mb-3 font-medium">Client Assignments (snapshots)</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client org</TableHead>
              <TableHead>Snapshot of</TableHead>
              <TableHead>Interest</TableHead>
              <TableHead>Advance</TableHead>
              <TableHead>Admin fee</TableHead>
              <TableHead>Tenure</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Preview</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productAssignments.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-muted-foreground">
                  No assignments yet. Future master pricing changes never touch
                  existing assignments — they are standalone snapshots.
                </TableCell>
              </TableRow>
            )}
            {productAssignments.map((assignment) => (
              <TableRow key={assignment.id}>
                <TableCell>org #{assignment.organizationId}</TableCell>
                <TableCell>v{assignment.sourceVersionNumber ?? '—'}</TableCell>
                <TableCell>{fractionToPercent(assignment.assignedInterestRate)}</TableCell>
                <TableCell>{fractionToPercent(assignment.assignedAdvanceRate)}</TableCell>
                <TableCell>{parseFloat(assignment.assignedAdminFee).toFixed(2)}</TableCell>
                <TableCell>{assignment.tenureDaysLimit}d</TableCell>
                <TableCell>
                  <Badge variant={assignment.status === 'ACTIVE' ? 'green' : 'default'}>
                    {assignment.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <select
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                    value=""
                    onChange={(e) => {
                      const templateId = parseInt(e.target.value, 10);
                      if (!Number.isNaN(templateId)) {
                        handlePreview(assignment.id, templateId);
                      }
                    }}
                  >
                    <option value="">Render template…</option>
                    {boundTemplates
                      .filter((t) => t.templateBody)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.documentCode}
                        </option>
                      ))}
                  </select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {/* Assign dialog */}
      <Dialog open={assignDialog} onOpenChange={setAssignDialog}>
        <DialogTitle>Assign {product.productCode} to a client</DialogTitle>
        <DialogDescription>
          Copies the currently PUBLISHED rate card into a standalone snapshot for
          the client (Snapshotted Assignment Pattern). The automated trigger on
          client activation arrives with the Product Approval flow.
        </DialogDescription>
        <div>
          <Label htmlFor="assign-org">Client organization id</Label>
          <Input
            id="assign-org"
            type="number"
            value={assignOrgId}
            onChange={(e) => setAssignOrgId(e.target.value)}
          />
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setAssignDialog(false)}>
            Cancel
          </Button>
          <Button
            disabled={!assignOrgId.trim() || createAssignment.isPending}
            onClick={handleAssign}
          >
            Create Snapshot Assignment
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Handlebars injection previewer */}
      <Sheet open={preview !== null} onOpenChange={() => setPreview(null)}>
        {preview && (
          <div className="space-y-3">
            <h2 className="text-base font-semibold">{preview.title}</h2>
            <pre className="max-h-[75vh] overflow-auto whitespace-pre-wrap rounded-md border bg-muted/40 p-4 text-xs leading-5">
              {preview.text}
            </pre>
          </div>
        )}
      </Sheet>
    </div>
  );
};

export default ProductDetail;
