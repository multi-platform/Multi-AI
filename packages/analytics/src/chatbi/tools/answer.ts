import { tool } from '@langchain/core/tools'
import {
	ChartAnnotation,
	ChartBusinessService,
	ChartMeasureSchema,
	DataSettings,
	DataSettingsSchema,
	Dimension,
	DimensionSchema,
	EntityType,
	getChartCategory,
	getEntityProperty,
	getPropertyMeasure,
	ISlicer,
	Measure,
	OrderBySchema,
	SlicerSchema,
	TimeRangesSlicer,
	TimeSlicerSchema,
	tryFixDimension,
	tryFixSlicer,
	tryFixVariableSlicer
} from '@metad/ocap-core'
import { firstValueFrom, Subject, Subscriber, takeUntil } from 'rxjs'
import { z } from 'zod'
import { ChatContext } from '../types'

type ChatAnswer = {
	preface: string
	dataSettings: DataSettings
	chartType: {
		type: string
	}
	dimensions: Dimension[]
	measures: Measure[]
	variables: ISlicer[]
	slicers: ISlicer[]
	timeSlicers: TimeRangesSlicer[]
}

export const ChatAnswerSchema = z.object({
	preface: z.string().describe('preface of the answer'),
	dataSettings: DataSettingsSchema.optional().describe('The data settings of the widget'),
	chartType: z
		.object({
			type: z.enum(['Column', 'Line', 'Pie', 'Bar']).describe('The chart type')
		})
		.optional()
		.describe('Chart configuration'),
	dimensions: z.array(DimensionSchema).optional().describe('The dimensions used by the chart'),
	measures: z.array(ChartMeasureSchema).optional().describe('The measures used by the chart'),
	orders: z.array(OrderBySchema).optional().describe('The orders used by the chart'),
	top: z.number().optional().describe('The number of top members'),
	slicers: z.array(SlicerSchema).optional().describe('The slicers to filter data'),
	timeSlicers: z.array(TimeSlicerSchema).optional().describe('The time slicers to filter data'),
	variables: z.array(SlicerSchema).optional().describe('The variables to the query of cube'),
	conclusion: z.string().optional().describe('conclusion of the answer')
})

export function createChatAnswerTool(context: ChatContext, subscriber: Subscriber<any>) {
	const { chatId, logger, dsCoreService, larkService } = context
	return tool(
		async (answer): Promise<string> => {
			logger.debug(`Execute copilot action 'answerQuestion':`, answer)
			try {
				if (answer.preface) {
					subscriber.next(answer.preface)
				}
				let entityType = null
				if (answer.dataSettings) {
					const entity = await firstValueFrom(
						dsCoreService.selectEntitySet(answer.dataSettings.dataSource, answer.dataSettings.entitySet)
					)
					entityType = entity.entityType
				}

				// Fetch data for chart or table or kpi
				if (answer.chartType) {
					const data = await drawChartMessage(
						{ ...context, entityType: entityType || context.entityType },
						subscriber,
						answer as ChatAnswer
					)

					return `The limit 100 of chart data is: ${JSON.stringify(data.slice(0, 100))}`
				}

				return `图表答案已经回复给用户了，请不要重复回答了。`
			} catch(err) {
				logger.error(err)

				return `出现错误: ${err}。如果需要用户提供更多信息，请直接提醒用户。`
				// try {
				// 	const result = await firstValueFrom(larkService.action({
				// 		data: {
				// 			receive_id: chatId,
				// 			content: JSON.stringify({text: err}),
				// 			msg_type: 'text'
				// 		},
				// 		params: {
				// 			receive_id_type: 'chat_id'
				// 		}
				// 	}))

				// 	logger.debug(`Error action 有回复:`, result)
				// } catch(err) {
				// 	console.error(`绝不应该出现的错误：`, err)
				// 	return `出现未知错误，请结束对话`
				// }
			}
		},
		{
			name: 'answerQuestion',
			description: 'Create chart answer for the question',
			schema: ChatAnswerSchema
		}
	)
}

async function drawChartMessage(context: ChatContext, subscriber: Subscriber<any>, answer: ChatAnswer): Promise<any[]> {
	const { entityType } = context
	const chartService = new ChartBusinessService(context.dsCoreService)
	const destroy$ = new Subject<void>()

	const chartAnnotation = {
		chartType: answer.chartType,
		dimensions: answer.dimensions.map((dimension) => tryFixDimension(dimension, context.entityType)),
		measures: answer.measures
	}

	const slicers = []
	if (answer.variables) {
		slicers.push(...answer.variables.map((slicer) => tryFixVariableSlicer(slicer, entityType)))
	}
	if (answer.slicers) {
		slicers.push(...answer.slicers.map((slicer) => tryFixSlicer(slicer, entityType)))
	}
	
	slicers.push(...(answer.timeSlicers ?? []))

	return new Promise((resolve, reject) => {
		chartService.selectResult().subscribe((result) => {
			if (result.error) {
				// subscriber.error(result.error)
				reject(result.error)
			} else {
				subscriber.next({
					type: 'interactive',
					data: createLineChart(chartAnnotation, context.entityType, result.data)
				})
				resolve(result.data)
			}
			destroy$.next()
			destroy$.complete()
		})

		chartService.selectResult()

		chartService
			.onAfterServiceInit()
			.pipe(takeUntil(destroy$))
			.subscribe(() => {
				chartService.refresh()
			})

		chartService.slicers = slicers
		chartService.dataSettings = {
			...answer.dataSettings,
			chartAnnotation
		}
	})
}

function createLineChart(chartAnnotation: ChartAnnotation, entityType: EntityType, data: any[]) {
	const measure = chartAnnotation.measures[0]
	const measureName = getPropertyMeasure(measure)
	const measureProperty = getEntityProperty(entityType, measure)

	return {
		elements: [
			{
				tag: 'chart',
				chart_spec: {
					type: 'line',
					title: {
						text: '折线图'
					},
					data: {
						values: data // 此处传入数据。
					},
					xField: getChartCategory(chartAnnotation).hierarchy,
					yField: measureName
				}
			}
		],
		header: {
			template: 'purple',
			title: { content: '卡片标题', tag: 'plain_text' }
		}
	}
}
