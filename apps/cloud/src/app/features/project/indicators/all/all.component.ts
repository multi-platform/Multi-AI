import { CommonModule } from '@angular/common'
import { Component, OnDestroy, computed, inject } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { RouterModule } from '@angular/router'
import { IndicatorsService } from '@metad/cloud/state'
import { NgmConfirmDeleteComponent, NgmTableComponent } from '@metad/ocap-angular/common'
import { AppearanceDirective, ButtonGroupDirective, DensityDirective } from '@metad/ocap-angular/core'
import { TranslateModule } from '@ngx-translate/core'
import { MaterialModule } from 'apps/cloud/src/app/@shared'
import { firstValueFrom, map } from 'rxjs'
import { IIndicator, ToastrService } from '../../../../@core/index'
import { ProjectComponent } from '../../project/project.component'
import { ProjectIndicatorsComponent } from '../indicators.component'
import { ProjectService } from '../../project.service'

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    MaterialModule,
    ButtonGroupDirective,
    DensityDirective,
    AppearanceDirective,
    NgmTableComponent
  ],
  selector: 'pac-indicator-all',
  templateUrl: './all.component.html',
  styleUrls: ['./all.component.scss']
})
export class AllIndicatorComponent implements OnDestroy {
  private projectComponent = inject(ProjectComponent)
  private indicatorsComponent = inject(ProjectIndicatorsComponent)
  private projectService = inject(ProjectService)
  private indicatorsService = inject(IndicatorsService)
  private toastrService = inject(ToastrService)
  private _dialog = inject(MatDialog)

  readonly indicators = computed(() => {
    const indicators = this.projectService.indicators() ?? []
    const newIndicators = this.projectService.newIndicators() ?? []

    return [
      ...newIndicators.reverse(),
      ...indicators
    ]
  })

  async onDelete(indicator: IIndicator) {
    const cofirm = await firstValueFrom(
      this._dialog.open(NgmConfirmDeleteComponent, { data: { value: indicator.name } }).afterClosed()
    )
    if (!cofirm) {
      return
    }

    try {
      await firstValueFrom(this.indicatorsService.delete(indicator.id))
      this.toastrService.success('PAC.INDICATOR.DeleteIndicator')
      this.projectComponent._removeIndicator(indicator.id)
    } catch (err) {
      this.toastrService.error(err)
    }
  }

  trackByName(_: number, item: IIndicator): string {
    return item.name
  }

  groupFilterFn(list: string[], item: IIndicator) {
    return list.some((name) => item.businessAreaId === name)
  }

  codeSortFn(a: IIndicator, b: IIndicator) {
    return a.code.localeCompare(b.code)
  }

  onRowSelectionChanging(rows: any) {
    this.indicatorsComponent.selectedIndicators.set(rows)
  }

  ngOnDestroy(): void {
    this.indicatorsComponent.selectedIndicators.set([])
  }
}
