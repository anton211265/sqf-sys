import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

import { Badge } from 'components/ui/badge';
import { Button } from 'components/ui/button';
import { Dialog, DialogDescription, DialogFooter, DialogTitle } from 'components/ui/dialog';
import { Input } from 'components/ui/input';
import { Label } from 'components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'components/ui/table';
import {
  useConfigProducts,
  useCreateBespoke,
  useCreateProduct,
  useUpdateProduct,
} from 'hooks/useConfigurator';
import { useHasPermission } from 'hooks/useRbac';
import { CONFIG } from 'constants/routes';
import { getApiResponseErrorMsg } from 'utils/apiHelper';
import {
  RateCardForm,
  RateCardFormState,
  emptyRateCardForm,
  formToPayload,
} from './RateCardForm';

/**
 * Product Registry & Polymorphic Management (blueprint / wireframe 5):
 * standard product matrix with is_active toggles + the Custom Bespoke Plan
 * Inception Workbench (client-restricted CST_ products, published v1 in one
 * step). Row click opens the product's rate cards / templates / assignments.
 */
const ProductRegistry: React.FC = () => {
  const navigate = useNavigate();
  const { data: products = [], isLoading } = useConfigProducts();
  const hasPermission = useHasPermission();
  const canManage = hasPermission('config_products_manage');
  const canBespoke = hasPermission('config_products_bespoke_create');

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const createBespoke = useCreateBespoke();

  const [dialog, setDialog] = React.useState<'standard' | 'bespoke' | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [code, setCode] = React.useState('');
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [clientOrgId, setClientOrgId] = React.useState('');
  const [rateForm, setRateForm] = React.useState<RateCardFormState>(emptyRateCardForm);

  const openDialog = (kind: 'standard' | 'bespoke') => {
    setError(null);
    setCode('');
    setName('');
    setDescription('');
    setClientOrgId('');
    setRateForm(emptyRateCardForm);
    setDialog(kind);
  };

  const submit = async () => {
    setError(null);
    try {
      if (dialog === 'standard') {
        const created = await createProduct.mutateAsync({
          productCode: code.trim().toUpperCase(),
          productName: name.trim(),
          description: description.trim() || undefined,
        });
        setDialog(null);
        navigate(`${CONFIG.PRODUCTS}/${created.id}`);
      } else if (dialog === 'bespoke') {
        const created = await createBespoke.mutateAsync({
          clientOwnerOrganizationId: parseInt(clientOrgId, 10),
          productName: name.trim(),
          description: description.trim() || undefined,
          ...formToPayload(rateForm),
        });
        setDialog(null);
        navigate(`${CONFIG.PRODUCTS}/${created.product.id}`);
      }
    } catch (e) {
      setError(getApiResponseErrorMsg(e));
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Product Registry</h1>
          <p className="text-sm text-muted-foreground">
            Standard offerings and client-restricted bespoke plans
          </p>
        </div>
        <div className="flex gap-2">
          {canBespoke && (
            <Button variant="outline" onClick={() => openDialog('bespoke')}>
              <Plus className="mr-2 h-4 w-4" /> Bespoke Product
            </Button>
          )}
          {canManage && (
            <Button onClick={() => openDialog('standard')}>
              <Plus className="mr-2 h-4 w-4" /> Standard Product
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Restricted to</TableHead>
              <TableHead>Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  Loading products…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && products.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  No products yet — create the standard offerings (AR, SCF, IF, TL)
                  to begin.
                </TableCell>
              </TableRow>
            )}
            {products.map((product) => (
              <TableRow
                key={product.id}
                className="cursor-pointer"
                onClick={() => navigate(`${CONFIG.PRODUCTS}/${product.id}`)}
              >
                <TableCell className="font-mono font-medium">
                  {product.productCode}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{product.productName}</div>
                  {product.description && (
                    <div className="text-xs text-muted-foreground">
                      {product.description}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {product.isCustomBespoke ? (
                    <Badge variant="purple">Bespoke</Badge>
                  ) : (
                    <Badge variant="blue">Standard</Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {product.clientOwnerOrganizationId
                    ? `org #${product.clientOwnerOrganizationId}`
                    : '—'}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {canManage ? (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={product.isActive}
                      aria-label={`Toggle ${product.productCode} active`}
                      onClick={() =>
                        updateProduct.mutate({
                          id: product.id,
                          isActive: !product.isActive,
                          changeReason: 'Registry toggle',
                        })
                      }
                      className={`relative h-5 w-9 rounded-full transition-colors ${
                        product.isActive ? 'bg-primary' : 'bg-muted-foreground/30'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                          product.isActive ? 'left-4.5 translate-x-4' : 'left-0.5'
                        }`}
                      />
                    </button>
                  ) : (
                    <Badge variant={product.isActive ? 'green' : 'default'}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialog !== null} onOpenChange={() => setDialog(null)}>
        <DialogTitle>
          {dialog === 'standard' ? 'New Standard Product' : 'Bespoke Product Workbench'}
        </DialogTitle>
        <DialogDescription>
          {dialog === 'standard'
            ? 'Registers a core offering; add rate card versions from its detail page.'
            : 'Creates a client-restricted CST_ product whose v1 rate card is published immediately — bespoke pricing applies to exactly one client.'}
        </DialogDescription>
        <div className="space-y-3">
          {dialog === 'standard' && (
            <div>
              <Label htmlFor="prod-code">Product code (e.g. AR, SCF, IF, TL)</Label>
              <Input id="prod-code" value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
          )}
          {dialog === 'bespoke' && (
            <div>
              <Label htmlFor="prod-client">Restricted to client organization id</Label>
              <Input
                id="prod-client"
                type="number"
                value={clientOrgId}
                onChange={(e) => setClientOrgId(e.target.value)}
              />
            </div>
          )}
          <div>
            <Label htmlFor="prod-name">Product name</Label>
            <Input id="prod-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="prod-desc">Description (optional)</Label>
            <Input
              id="prod-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          {dialog === 'bespoke' && <RateCardForm value={rateForm} onChange={setRateForm} />}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDialog(null)}>
            Cancel
          </Button>
          <Button
            disabled={
              !name.trim() ||
              (dialog === 'standard' && !code.trim()) ||
              (dialog === 'bespoke' && !clientOrgId.trim()) ||
              createProduct.isPending ||
              createBespoke.isPending
            }
            onClick={submit}
          >
            {dialog === 'standard' ? 'Create Product' : 'Create & Publish v1'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default ProductRegistry;
