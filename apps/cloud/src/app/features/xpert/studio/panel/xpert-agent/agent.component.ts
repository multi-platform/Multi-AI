import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  model,
  signal,
  viewChild
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import { FFlowModule } from '@foblex/flow'
import { NgmHighlightVarDirective } from '@metad/ocap-angular/common'
import { TranslateModule } from '@ngx-translate/core'
import { ICopilotModel, IfAnimation, IXpertAgent, ModelType, XpertService } from 'apps/cloud/src/app/@core'
import { XpertAvatarComponent, MaterialModule, CopilotModelSelectComponent } from 'apps/cloud/src/app/@shared'
import { XpertStudioApiService } from '../../domain'
import { XpertStudioPanelRoleToolsetComponent } from './toolset/toolset.component'
import { XpertStudioPanelAgentExecutionComponent } from '../agent-execution/execution.component'


@Component({
  selector: 'xpert-studio-panel-agent',
  templateUrl: './agent.component.html',
  styleUrls: ['./agent.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FFlowModule,
    MaterialModule,
    FormsModule,
    TranslateModule,
    XpertAvatarComponent,
    NgmHighlightVarDirective,
    XpertStudioPanelRoleToolsetComponent,
    CopilotModelSelectComponent,
    XpertStudioPanelAgentExecutionComponent
  ],
  host: {
    tabindex: '-1',
    '[class.selected]': 'isSelected',
    '(contextmenu)': 'emitSelectionChangeEvent($event)'
  },
  animations: [
    IfAnimation
  ]
})
export class XpertStudioPanelAgentComponent {
  eModelType = ModelType
  readonly regex = `{{(.*?)}}`
  readonly elementRef = inject(ElementRef)
  readonly apiService = inject(XpertStudioApiService)
  readonly xpertService = inject(XpertService)

  readonly key = input<string>()
  readonly nodes = computed(() => this.apiService.viewModel()?.nodes)
  readonly node = computed(() => this.nodes()?.find((_) => _.key === this.key()))
  readonly xpertAgent = computed(() => this.node()?.entity as IXpertAgent)
  readonly promptInputElement = viewChild('editablePrompt', { read: ElementRef<HTMLDivElement> })

  readonly xpert = computed(() => this.apiService.viewModel()?.team)
  readonly xpertCopilotModel = computed(() => this.xpert()?.copilotModel)
  readonly toolsets = computed(() => this.xpertAgent()?.toolsets)
  readonly name = computed(() => this.xpertAgent()?.name)
  readonly title = computed(() => this.xpertAgent()?.title)
  readonly prompt = model<string>()
  readonly promptLength = computed(() => this.prompt()?.length)

  private get hostElement(): HTMLElement {
    return this.elementRef.nativeElement
  }

  readonly nameError = computed(() => {
    const name = this.name()
    return this.nodes().filter((_) => _.key !== this.key()).some((n) => n.entity.name === name)
  })

  readonly copilotModel = model<ICopilotModel>()

  readonly openedExecution = signal(false)

  constructor() {
    effect(() => {
      if (this.xpertAgent()) {
        this.prompt.set(this.xpertAgent().prompt)
        this.copilotModel.set(this.xpertAgent().copilotModel)
      }
    }, { allowSignalWrites: true })

    effect(() => {
      console.log(`copilotModel:`, this.name(), this.nameError())
    })
    
  }

  onNameChange(event: string) {
    this.apiService.updateXpertAgent(this.key(), { name: event }, {emitEvent: false})
  }
  onTitleChange(event: string) {
    this.apiService.updateXpertAgent(this.key(), {
      title: event
    }, {emitEvent: false})
  }
  onDescChange(event: string) {
    this.apiService.updateXpertAgent(this.key(), { description: event }, {emitEvent: false})
  }
  onBlur() {
    this.apiService.reload()
  }
  onPromptChange() {
    const text = this.promptInputElement().nativeElement.textContent
    this.prompt.set(text)
    this.apiService.updateXpertAgent(this.key(), { prompt: text })
  }

  updateCopilotModel(model: ICopilotModel) {
    this.apiService.updateXpertAgent(this.key(), { copilotModel: model })
  }

  openExecution() {
    this.openedExecution.set(true)
  }
  closeExecution() {
    this.openedExecution.set(false)
  }
}
