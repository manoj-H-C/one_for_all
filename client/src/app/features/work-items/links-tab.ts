import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { WorkItemLinkService } from '../../core/services/work-item-link.service';
import { WorkItemLinkResponse } from '../../core/models/work-item-link.model';
import { WORK_ITEM_LINK_TYPES } from '../../core/models/common.model';
import { ToastService } from '../../core/state/toast.service';
import { CurrentProjectStore } from '../../core/state/current-project.store';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog.service';

const LINK_TYPE_LABEL: Record<string, string> = {
  PARENT_OF: 'is the parent of',
  BLOCKS: 'blocks',
  DUPLICATES: 'duplicates',
  RELATES_TO: 'relates to',
};

@Component({
  selector: 'app-links-tab',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="flex flex-col gap-4">
      @if (canEdit()) {
        <div class="flex flex-col flex-wrap gap-2 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-end">
          <div class="min-w-[180px] flex-1">
            <label class="label">Link type</label>
            <select class="input" [(ngModel)]="linkType">
              @for (t of linkTypes; track t) {
                <option [value]="t">{{ labelFor(t) }}</option>
              }
            </select>
          </div>
          <div class="flex-1">
            <label class="label">Target {{ currentProjectStore.itemLabelSingular().toLowerCase() }} id</label>
            <input type="text" class="input" placeholder="paste the other item's id" [(ngModel)]="targetId" />
          </div>
          <button type="button" class="btn-primary" [disabled]="!targetId().trim()" (click)="add()">Link</button>
        </div>
      }

      @for (link of links(); track link.id) {
        <div class="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm">
          <p>
            This item <span class="font-medium">{{ labelFor(link.linkType) }}</span>
            <a [routerLink]="['/projects', projectId(), 'work-items', link.targetWorkItemId]" class="text-primary-700 hover:underline">
              {{ link.targetWorkItemId }}
            </a>
          </p>
          <button type="button" class="text-xs text-slate-400 hover:text-red-600" (click)="remove(link)">Remove</button>
        </div>
      } @empty {
        <p class="text-sm text-slate-400">No linked {{ currentProjectStore.itemLabelPlural().toLowerCase() }} yet.</p>
      }
    </div>
  `,
})
export class LinksTabComponent implements OnInit {
  private readonly linkService = inject(WorkItemLinkService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly currentProjectStore = inject(CurrentProjectStore);

  readonly workItemId = input.required<string>();
  readonly projectId = input.required<string>();
  readonly canEdit = input<boolean>(false);

  readonly links = signal<WorkItemLinkResponse[]>([]);
  readonly linkTypes = WORK_ITEM_LINK_TYPES;
  readonly linkType = signal<string>('RELATES_TO');
  readonly targetId = signal('');

  ngOnInit(): void {
    this.linkService.list(this.workItemId()).subscribe((links) => this.links.set(links));
  }

  labelFor(type: string): string {
    return LINK_TYPE_LABEL[type] ?? type;
  }

  add(): void {
    const targetWorkItemId = this.targetId().trim();
    if (!targetWorkItemId) return;
    this.linkService
      .create(this.workItemId(), { targetWorkItemId, linkType: this.linkType() as never })
      .subscribe({
        next: (link) => {
          this.links.update((list) => [link, ...list]);
          this.targetId.set('');
        },
        error: (err) => this.toast.error(err.message),
      });
  }

  async remove(link: WorkItemLinkResponse): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(
      `Remove this link between the two ${this.currentProjectStore.itemLabelPlural().toLowerCase()}?`,
      { title: 'Remove link', confirmLabel: 'Remove' },
    );
    if (!confirmed) return;
    this.linkService.delete(this.workItemId(), link.id).subscribe({
      next: () => this.links.update((list) => list.filter((l) => l.id !== link.id)),
      error: (err) => this.toast.error(err.message),
    });
  }
}
