import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function BoardMembersList({
	members = [],
	onEdit,
	onDelete,
}: any) {
	return (
		<CardContent>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{members.length === 0 ? (
					<div className="col-span-3 text-center py-8 text-gray-500">
						<Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
						<p>No board members yet.</p>
					</div>
				) : (
					(members as any[]).map((member: any) => (
						<Card key={member.id}>
							<CardContent className="p-4 text-center relative">
								<div className="absolute top-2 right-2 flex space-x-1">
									<Button
										size="sm"
										variant="outline"
										onClick={() => onEdit && onEdit(member)}
									>
										<Edit className="w-3 h-3" />
									</Button>
									<Button
										size="sm"
										variant="outline"
										onClick={() => onDelete && onDelete(member.id)}
										className="text-red-600 hover:text-red-700 hover:border-red-300"
									>
										<Trash2 className="w-3 h-3" />
									</Button>
								</div>

								<div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden bg-gray-200">
									{member.photoUrl ? (
										<img
											src={member.photoUrl}
											alt={member.name}
											className="w-full h-full object-cover"
										/>
									) : (
										<div className="w-full h-full flex items-center justify-center">
											<Users className="w-8 h-8 text-gray-400" />
										</div>
									)}
								</div>

								<h4 className="font-semibold text-lg">{member.name}</h4>
								<p className="text-primary font-medium">{member.position}</p>
								{member.bio && (
									<p className="text-sm text-gray-600 mt-2 line-clamp-3">
										{member.bio}
									</p>
								)}
								<Badge className="mt-2" variant="outline">
									Order: {member.order || 0}
								</Badge>
							</CardContent>
						</Card>
					))
				)}
			</div>
		</CardContent>
	);
}
