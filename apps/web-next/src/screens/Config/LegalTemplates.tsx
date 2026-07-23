import * as React from 'react';
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
import { useCreateTemplate, useTemplates } from 'hooks/useConfigurator';
import { useHasPermission } from 'hooks/useRbac';
import { getApiResponseErrorMsg } from 'utils/apiHelper';

/**
 * Legal Document Template registry. Inline Handlebars bodies power the
 * injection previewer ({{key}} and {{multiply key factor}}); S3-backed
 * template files are a later phase. Bind templates to products from each
 * product's detail page.
 */
const LegalTemplates: React.FC = () => {
  const { data: templates = [], isLoading } = useTemplates();
  const hasPermission = useHasPermission();
  const canManage = hasPermission('config_legal_templates_manage');
  const createTemplate = useCreateTemplate();

  const [open, setOpen] = React.useState(false);
  const [code, setCode] = React.useState('');
  const [name, setName] = React.useState('');
  const [body, setBody] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const submit = async () => {
    setError(null);
    try {
      await createTemplate.mutateAsync({
        documentCode: code.trim().toUpperCase().replace(/\s+/g, '_'),
        documentName: name.trim(),
        templateBody: body.trim() || undefined,
      });
      setOpen(false);
      setCode('');
      setName('');
      setBody('');
    } catch (e) {
      setError(getApiResponseErrorMsg(e));
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Legal Templates</h1>
          <p className="text-sm text-muted-foreground">
            Document templates bound to products; variables inject from the
            client's snapshotted assignment
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Template
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Body</TableHead>
              <TableHead>Required by default</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  Loading templates…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && templates.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  No templates yet.
                </TableCell>
              </TableRow>
            )}
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-mono font-medium">
                  {template.documentCode}
                </TableCell>
                <TableCell>{template.documentName}</TableCell>
                <TableCell>
                  {template.templateBody ? (
                    <Badge variant="green">inline body</Badge>
                  ) : (
                    <Badge variant="outline">file (later phase)</Badge>
                  )}
                </TableCell>
                <TableCell>{template.isRequiredDefault ? 'Yes' : 'No'}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(template.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTitle>New Legal Template</DialogTitle>
        <DialogDescription>
          Handlebars variables: {'{{assigned_interest_rate}}'},{' '}
          {'{{assigned_admin_fee}}'}, {'{{tenure_days_limit}}'},{' '}
          {'{{product_name}}'}, {'{{currentDate}}'},{' '}
          {'{{multiply assigned_interest_rate 100}}'} …
        </DialogDescription>
        <div className="space-y-3">
          <div>
            <Label htmlFor="tpl-code">Document code (e.g. NOTICE_OF_ASSIGNMENT)</Label>
            <Input id="tpl-code" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="tpl-name">Document name</Label>
            <Input id="tpl-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="tpl-body">Template body (Handlebars)</Label>
            <textarea
              id="tpl-body"
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full rounded-md border border-input bg-background p-3 font-mono text-xs"
              placeholder={'FACILITY CONFIRMATION\nDate: {{currentDate}}\nRate: {{multiply assigned_interest_rate 100}}%'}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={!code.trim() || !name.trim() || createTemplate.isPending}
            onClick={submit}
          >
            Create Template
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default LegalTemplates;
