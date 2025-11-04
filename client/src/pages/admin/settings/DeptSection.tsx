import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, HouseIcon } from "lucide-react";

export default function DeptSection({
	departments = [],
	onAdd,
	onDelete,
	deptForm,
}: any) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<div>
					<CardTitle>Departments Management</CardTitle>
					<p className="text-sm text-gray-600 mt-1">Manage departments</p>
				</div>
				<Dialog>
					<DialogTrigger asChild>
						<Button>
							<Plus className="w-4 h-4 mr-2" />
							Add Department
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Add New Department</DialogTitle>
						</DialogHeader>
						{/* Use deptForm passed from parent and call onAdd on submit */}
						<form
							onSubmit={
								deptForm
									? deptForm.handleSubmit(onAdd)
									: (e) => e.preventDefault()
							}
							className="space-y-4"
						>
							<div>
								<Label htmlFor="dept-name">Department Name</Label>
								<Input
									id="dept-name"
									{...(deptForm ? deptForm.register("name") : {})}
									placeholder="e.g., Health Services and Sanitation..."
								/>
								{deptForm?.formState.errors.name && (
									<p className="text-sm text-red-600 mt-1">
										{deptForm.formState.errors.name.message}
									</p>
								)}
							</div>
							<div className="flex justify-end space-x-2">
								<Button type="submit">Add Department</Button>
							</div>
						</form>
					</DialogContent>
				</Dialog>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{departments.length === 0 ? (
						<div className="col-span-3 text-center py-8 text-gray-500">
							<HouseIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
							<p>No departments yet. Click "Add Department" to get started.</p>
						</div>
					) : (
						departments.map((dept: any) => (
							<Card key={dept.id}>
								<CardContent className="p-4">
									<div className="flex justify-between item-starts mb-2">
										<h4 className="font-semibold mb-2">{dept.name}</h4>
										<div className="flex justify space-x-1">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => onDelete && onDelete(dept.id)}
											>
												<Trash2 className="w-4 h-4" />
											</Button>
										</div>
									</div>
									{dept.description && (
										<p className="text-sm text-gray-600">{dept.description}</p>
									)}
								</CardContent>
							</Card>
						))
					)}
				</div>
			</CardContent>
		</Card>
	);
}
