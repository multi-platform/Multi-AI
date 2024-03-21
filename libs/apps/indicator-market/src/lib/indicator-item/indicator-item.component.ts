import { Component, Input, inject } from '@angular/core'
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop'
import { BehaviorSubject, distinctUntilChanged, EMPTY, filter, switchMap, tap } from 'rxjs'
import { IndicatorsStore } from '../services/store'
import { IndicatorState, IndicatorTagEnum, StatisticalType, Trend } from '../types'
import { IndicatorItemDataService } from './indicator-item.service'


/**
 * 由于 cdk-virtual-scroll 原理 (待严格确定) 此组件不会随 indicator 变化而重新创建, 所以此组件的 indicator 输入会变化, 导致指标数据显示混乱
 * 
 */
@Component({
  selector: 'pac-indicator-item',
  templateUrl: 'indicator-item.component.html',
  styleUrls: ['indicator-item.component.scss'],
  providers: [ IndicatorItemDataService ]
})
export class IndicatorItemComponent {
  statisticalType: StatisticalType = StatisticalType.CurrentPeriod
  TagEnum = IndicatorTagEnum
  TREND = Trend

  private readonly dataService = inject(IndicatorItemDataService)
  private readonly store = inject(IndicatorsStore)

  @Input() get indicator(): IndicatorState {
    return this.indicator$.value
  }
  set indicator(value) {
    this.indicator$.next(value)
  }
  public indicator$ = new BehaviorSubject(null)

  @Input() tag: IndicatorTagEnum

  readonly loading$ = this.dataService.loading$

  /**
   * Subscriptions
   */
  readonly #lookBackSub = toObservable(this.store.lookback)
    .pipe(
      switchMap((lookBack) => {
        let initialized = false
        return this.indicator$.pipe(
          distinctUntilChanged(),
          switchMap((indicator) => {
            if (indicator?.dataSettings && (!indicator.initialized || !initialized)) {
              this.dataService.patchState({
                indicatorId: indicator.id,
                lookBack
              })
              
              this.dataService.dataSettings = indicator.dataSettings
              initialized = true

              return this.dataService.onAfterServiceInit().pipe(tap(() => this.dataService.refresh()))
            }

            return EMPTY
          }),
        )
      }),
      takeUntilDestroyed()
    )
    .subscribe(() => {
      //
    })

  readonly #indicatorResultSub = this.dataService.selectResult()
    .pipe(
      filter((result: any) => result.indicator?.id && result.indicator?.id === this.indicator?.id),
      takeUntilDestroyed()
    )
    .subscribe((result: any) => {
      if (result?.error) {
        this.store.updateIndicator({
          id: result.indicator.id,
          changes: {
            initialized: true,
            loaded: true,
            error: result.error
          }
        })
      } else {
        this.store.updateIndicator({
          id: result.indicator.id,
          changes: {
            initialized: true,
            loaded: true,
            trends: result.trends,
            data: result.data,
            trend: result.trend,
            error: null
          }
        })
      }
    })

  // Response to global refresh event
  private refreshSub = this.store.onRefresh().pipe(takeUntilDestroyed()).subscribe((force) => {
    this.dataService.refresh(force)
  })

  open() {
    console.log('open')
  }

  close() {
    console.log('close')
  }

  toggleTag(event) {
    event.stopPropagation()
    event.preventDefault()

    this.store.toggleTag()
  }
  
}
