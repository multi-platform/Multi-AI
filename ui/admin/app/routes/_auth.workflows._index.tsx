import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { PenSquareIcon } from "lucide-react";
import { useMemo } from "react";
import { MetaFunction, useNavigate } from "react-router";
import { $path } from "safe-routes";
import useSWR, { preload } from "swr";

import { Workflow } from "~/lib/model/workflows";
import { ThreadsService } from "~/lib/service/api/threadsService";
import { WorkflowService } from "~/lib/service/api/workflowService";
import { timeSince } from "~/lib/utils";

import { DataTable } from "~/components/composed/DataTable";
import { Button } from "~/components/ui/button";
import { Link } from "~/components/ui/link";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import { CreateWorkflow } from "~/components/workflow/CreateWorkflow";
import { DeleteWorkflowButton } from "~/components/workflow/DeleteWorkflow";
import { WorkflowViewYaml } from "~/components/workflow/WorkflowView";

export async function clientLoader() {
	await Promise.all([
		preload(WorkflowService.getWorkflows.key(), WorkflowService.getWorkflows),
		preload(ThreadsService.getThreads.key(), ThreadsService.getThreads),
	]);
	return null;
}

export default function Workflows() {
	const navigate = useNavigate();
	const getWorkflows = useSWR(
		WorkflowService.getWorkflows.key(),
		WorkflowService.getWorkflows
	);

	const getThreads = useSWR(
		ThreadsService.getThreads.key(),
		ThreadsService.getThreads
	);

	const threadCounts = useMemo(() => {
		if (
			!getWorkflows.data ||
			!getThreads.data ||
			!Array.isArray(getWorkflows.data)
		)
			return {};

		return getThreads.data?.reduce(
			(acc, thread) => {
				if (!thread.workflowID) return acc;

				acc[thread.workflowID] = (acc[thread.workflowID] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);
	}, [getThreads.data, getWorkflows.data]);

	const navigateToWorkflow = (workflow: Workflow) => {
		navigate(
			$path("/workflows/:workflow", {
				workflow: workflow.id,
			})
		);
	};

	return (
		<div>
			<div className="flex h-full flex-col gap-4 p-8">
				<div className="flex-auto overflow-hidden">
					<div className="width-full mb-8 flex justify-between space-x-2">
						<h2>Workflows</h2>

						<CreateWorkflow />
					</div>

					<DataTable
						columns={getColumns()}
						data={getWorkflows.data || []}
						sort={[{ id: "created", desc: true }]}
						onRowClick={navigateToWorkflow}
					/>
				</div>
			</div>
		</div>
	);

	function getColumns(): ColumnDef<Workflow, string>[] {
		return [
			columnHelper.accessor("name", {
				header: "Name",
			}),
			columnHelper.accessor("description", {
				header: "Description",
			}),
			columnHelper.accessor(
				(workflow) => threadCounts[workflow.id]?.toString(),
				{
					id: "threads-action",
					header: "Threads",
					cell: (info) => (
						<div className="flex items-center gap-2">
							<Link
								onClick={(event) => event.stopPropagation()}
								to={$path("/threads", {
									workflowId: info.row.original.id,
									from: "workflows",
								})}
								className="px-0"
							>
								<p>{info.getValue() || 0} Threads</p>
							</Link>
						</div>
					),
				}
			),
			columnHelper.accessor("created", {
				id: "created",
				header: "Created",
				cell: (info) => (
					<p>{timeSince(new Date(info.row.original.created))} ago</p>
				),
			}),
			columnHelper.display({
				id: "actions",
				cell: ({ row }) => (
					<div className="flex justify-end gap-2">
						<WorkflowViewYaml workflow={row.original} />

						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									size="icon"
									variant="ghost"
									onClick={() => navigateToWorkflow(row.original)}
								>
									<PenSquareIcon />
								</Button>
							</TooltipTrigger>

							<TooltipContent>Edit Workflow</TooltipContent>
						</Tooltip>

						<DeleteWorkflowButton id={row.original.id} />
					</div>
				),
			}),
		];
	}
}

const columnHelper = createColumnHelper<Workflow>();

export const meta: MetaFunction = () => {
	return [{ title: `Obot • Workflows` }];
};
