import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';

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
  useCalendar,
  useDeleteCalendarDay,
  usePatchCalendarSettings,
  useUpsertCalendarDay,
} from 'hooks/useConfigurator';
import { useHasPermission } from 'hooks/useRbac';
import { getApiResponseErrorMsg } from 'utils/apiHelper';

const typeVariant = (dayType: string): 'default' | 'amber' | 'red' =>
  dayType === 'HOLIDAY' ? 'default' : dayType === 'HALF_DAY' ? 'amber' : 'red';

/**
 * Global Clearing Calendar Engine (wireframe 8, bottom half):
 * multi-jurisdictional holiday registry, settlement roll-over rule and
 * cut-off/exception days. Same region+date upserts in place.
 */
const ClearingCalendar: React.FC = () => {
  const { data, isLoading } = useCalendar();
  const hasPermission = useHasPermission();
  const canManage = hasPermission('config_calendar_manage');

  const upsertDay = useUpsertCalendarDay();
  const deleteDay = useDeleteCalendarDay();
  const patchSettings = usePatchCalendarSettings();

  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [region, setRegion] = React.useState('');
  const [dayDate, setDayDate] = React.useState('');
  const [dayType, setDayType] = React.useState('HOLIDAY');
  const [description, setDescription] = React.useState('');
  const [cutoffTime, setCutoffTime] = React.useState('');
  const [rollover, setRollover] = React.useState('');

  React.useEffect(() => {
    if (data?.settings) setRollover(data.settings.rolloverRule);
  }, [data?.settings]);

  const submitDay = async () => {
    setError(null);
    try {
      await upsertDay.mutateAsync({
        region: region.trim().toUpperCase(),
        dayDate: dayDate.trim(),
        dayType,
        description: description.trim() || undefined,
        cutoffTime: dayType === 'HALF_DAY' && cutoffTime.trim() ? cutoffTime.trim() : undefined,
      });
      setOpen(false);
    } catch (e) {
      setError(getApiResponseErrorMsg(e));
    }
  };

  const saveRollover = async () => {
    setError(null);
    setNotice(null);
    try {
      await patchSettings.mutateAsync({ rolloverRule: rollover });
      setNotice('Roll-over rule saved.');
    } catch (e) {
      setError(getApiResponseErrorMsg(e));
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Clearing Calendar</h1>
          <p className="text-sm text-muted-foreground">
            Holiday registries, roll-over rules and cut-off days read by
            maturity & settlement date math
          </p>
        </div>
        {canManage && (
          <Button onClick={() => { setError(null); setRegion(''); setDayDate(''); setDayType('HOLIDAY'); setDescription(''); setCutoffTime(''); setOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add Day
          </Button>
        )}
      </div>
      {(error || notice) && (
        <div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {notice && <p className="text-sm text-emerald-700">{notice}</p>}
        </div>
      )}

      <section className="max-w-xl rounded-lg border bg-background p-4">
        <h2 className="mb-3 font-medium">Settlement Roll-Over Rule</h2>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Label htmlFor="cal-rollover">When maturity hits an exclusion day</Label>
            <select
              id="cal-rollover"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={rollover}
              disabled={!canManage}
              onChange={(e) => setRollover(e.target.value)}
            >
              <option value="MODIFIED_FOLLOWING">Modified Following Business Day</option>
              <option value="PRECEDING">Preceding Business Day</option>
            </select>
          </div>
          {canManage && (
            <Button size="sm" onClick={saveRollover} disabled={patchSettings.isPending || !rollover}>
              Save
            </Button>
          )}
        </div>
      </section>

      <section className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Region</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Cut-off</TableHead>
              <TableHead>Description</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data?.days ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  {isLoading ? 'Loading…' : 'No calendar days configured.'}
                </TableCell>
              </TableRow>
            )}
            {(data?.days ?? []).map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-mono font-medium">{row.region}</TableCell>
                <TableCell>{row.dayDate}</TableCell>
                <TableCell>
                  <Badge variant={typeVariant(row.dayType)}>{row.dayType}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{row.cutoffTime ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{row.description ?? '—'}</TableCell>
                <TableCell className="text-right">
                  {canManage && (
                    <button
                      type="button"
                      aria-label={`Delete ${row.region} ${row.dayDate}`}
                      onClick={() => deleteDay.mutate(row.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTitle>Add Calendar Day</DialogTitle>
        <DialogDescription>
          Same region + date upserts in place. Cut-off applies to half-days.
        </DialogDescription>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="cal-region">Region (e.g. UK, US, MY)</Label>
              <Input id="cal-region" value={region} onChange={(e) => setRegion(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="cal-date">Date</Label>
              <Input id="cal-date" type="date" value={dayDate} onChange={(e) => setDayDate(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="cal-type">Type</Label>
              <select
                id="cal-type"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={dayType}
                onChange={(e) => setDayType(e.target.value)}
              >
                <option value="HOLIDAY">Holiday</option>
                <option value="HALF_DAY">Half-day</option>
                <option value="SHUTDOWN">Ad-hoc shutdown</option>
              </select>
            </div>
            {dayType === 'HALF_DAY' && (
              <div>
                <Label htmlFor="cal-cutoff">Cut-off (HH:MM)</Label>
                <Input id="cal-cutoff" value={cutoffTime} onChange={(e) => setCutoffTime(e.target.value)} placeholder="12:00" />
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="cal-desc">Description (optional)</Label>
            <Input id="cal-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={!region.trim() || !dayDate.trim() || upsertDay.isPending} onClick={submitDay}>
            Save Day
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default ClearingCalendar;
