import { ChatBIModelOptions, IChatBIModel, ICopilotRole, IIntegration, ISemanticModel } from '@metad/contracts'
import { CopilotRole } from '@metad/server-ai'
import { Integration, TenantOrganizationBaseEntity } from '@metad/server-core'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsJSON, IsNumber, IsOptional, IsString } from 'class-validator'
import { Column, Entity, Index, JoinColumn, JoinTable, ManyToMany, ManyToOne, RelationId } from 'typeorm'
import { SemanticModel, SemanticModelEntity } from '../core/entities/internal'

@Entity('chatbi_model')
@Index(['modelId', 'entity'], { unique: true })
export class ChatBIModel extends TenantOrganizationBaseEntity implements IChatBIModel {
	/**
	 * Model
	 */
	@ApiProperty({ type: () => SemanticModel })
	@ManyToOne(() => SemanticModel, (d) => d.entities, {
		nullable: true,
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	model?: ISemanticModel

	@ApiProperty({ type: () => String })
	@RelationId((it: SemanticModelEntity) => it.model)
	@IsString()
	@Column({ nullable: true })
	modelId: string

	@ApiPropertyOptional({ type: () => String })
	@IsString()
	@IsOptional()
	@Column({ nullable: true })
	entity: string

	@ApiPropertyOptional({ type: () => String })
	@IsString()
	@IsOptional()
	@Column({ nullable: true })
	entityCaption?: string

	@ApiPropertyOptional({ type: () => String })
	@IsString()
	@IsOptional()
	@Column({ nullable: true })
	entityDescription?: string

	@ApiPropertyOptional({ type: () => Number })
	@IsNumber()
	@IsOptional()
	@Column({ nullable: true })
	visits?: number

	@ApiPropertyOptional({ type: () => Object })
	@IsJSON()
	@IsOptional()
	@Column({ type: 'json', nullable: true })
	options?: ChatBIModelOptions

	/*
    |--------------------------------------------------------------------------
    | @ManyToMany 
    |--------------------------------------------------------------------------
    */
	// Copilot role's chat models
	@ManyToMany(() => CopilotRole, {
		onUpdate: 'CASCADE',
		onDelete: 'CASCADE'
	})
	@JoinTable({
		name: 'copilot_role_chat_model'
	})
	roles?: ICopilotRole[]

	@ManyToMany(() => Integration, {
		onUpdate: 'CASCADE',
		onDelete: 'CASCADE'
	})
	@JoinTable({
		name: 'integration_chat_model'
	})
	integrations?: IIntegration[]
}
